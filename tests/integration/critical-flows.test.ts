import assert from 'node:assert/strict'
import test from 'node:test'

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
const hasDb = Boolean(databaseUrl)

test('integration skipped without TEST_DATABASE_URL or DATABASE_URL', { skip: hasDb }, () => {
  assert.equal(hasDb, false)
})

test('critical flows against PostgreSQL', { skip: !hasDb }, async (t) => {
  process.env.DATABASE_URL = databaseUrl
  process.env.NUXT_DATABASE_URL = databaseUrl
  process.env.ZARINPAL_MERCHANT_ID = ''
  process.env.PAYMENT_DRIVER = 'zarinpal'
  process.env.STORAGE_DRIVER = 'local'

  const { closeDb, getDb } = await import('../../server/db/client')
  const { users, bookings, payments, disputes } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const { petService } = await import('../../server/services/pet.service')
  const { providerService } = await import('../../server/services/provider.service')
  const { availabilityService } = await import('../../server/services/availability.service')
  const { bookingService } = await import('../../server/services/booking.service')
  const { paymentService } = await import('../../server/services/payment.service')
  const { resetPaymentGateway } = await import('../../server/payments')
  const { reportService } = await import('../../server/services/report.service')
  const { disputeService } = await import('../../server/services/dispute.service')
  const { adminService } = await import('../../server/services/admin.service')
  const { AppError } = await import('../../server/utils/errors')
  const { WEEKDAYS } = await import('../../shared/constants/availability')

  resetPaymentGateway()
  const db = getDb()
  const suffix = `${Date.now()}`

  async function insertUser(email: string, role: 'OWNER' | 'PROVIDER' | 'ADMIN' = 'OWNER') {
    const [row] = await db.insert(users).values({
      email,
      passwordHash: 'test-hash-not-for-login',
      displayName: email.slice(0, 20),
      firstName: 'تست',
      lastName: 'کاربر',
      role,
    }).returning()
    if (!row) throw new Error('user insert failed')
    return row
  }

  const owner = await insertUser(`owner-${suffix}@petyar.test`)
  const stranger = await insertUser(`stranger-${suffix}@petyar.test`)
  const providerUser = await insertUser(`prov-${suffix}@petyar.test`, 'PROVIDER')
  const admin = await insertUser(`admin-${suffix}@petyar.test`, 'ADMIN')

  await t.test('pet ownership IDOR', async () => {
    const created = await petService.create(owner.id, { name: 'لوکا', type: 'DOG', gender: 'MALE' })
    await assert.rejects(
      () => petService.getOwned(stranger.id, created.id),
      (err: unknown) => err instanceof AppError && err.code === 'FORBIDDEN',
    )
    const mine = await petService.getOwned(owner.id, created.id)
    assert.equal(mine.name, 'لوکا')
  })

  const pet = await petService.create(owner.id, { name: 'پشمک', type: 'CAT', gender: 'FEMALE' })
  const { profile } = await providerService.create(providerUser.id, { displayName: 'نگهبان تست', city: 'تهران' })
  const service = await providerService.createService(providerUser.id, {
    categoryId: '11111111-1111-4111-8111-111111111111',
    title: 'نگهداری ساعتی',
    pricingType: 'HOURLY',
    price: 100000,
    durationMinutes: 60,
    capacity: 1,
    isActive: true,
  })
  for (const weekday of WEEKDAYS) {
    await availabilityService.createRule(providerUser.id, {
      weekday,
      startTime: '00:00',
      endTime: '23:59',
      isActive: true,
    })
  }

  const start = new Date('2026-11-02T08:00:00+03:30')
  const end = new Date('2026-11-02T10:00:00+03:30')

  await t.test('booking price is server-calculated', async () => {
    const quote = await bookingService.quote(profile.id, service.id, start.toISOString(), end.toISOString())
    assert.equal(quote.totalAmount, 200000)
    const booking = await bookingService.create(owner.id, {
      providerId: profile.id,
      serviceId: service.id,
      petId: pet.id,
      start: start.toISOString(),
      end: end.toISOString(),
    })
    assert.equal(booking.totalAmount, quote.totalAmount)
    assert.equal(booking.ownerId, owner.id)
  })

  const [bookingRow] = await db.select().from(bookings).where(eq(bookings.ownerId, owner.id)).limit(1)
  if (!bookingRow) throw new Error('booking missing')

  await t.test('stranger cannot read owner booking', async () => {
    await assert.rejects(
      () => bookingService.getForOwner(stranger.id, bookingRow.id),
      (err: unknown) => err instanceof AppError && (err.code === 'FORBIDDEN' || err.code === 'NOT_FOUND'),
    )
  })

  await t.test('invalid transitions and unpaid confirm are rejected', async () => {
    await assert.rejects(
      () => bookingService.complete(providerUser.id, bookingRow.id),
      (err: unknown) => err instanceof AppError && err.code === 'CONFLICT',
    )
    await assert.rejects(
      () => paymentService.initiateForOwner(owner.id, bookingRow.id),
      (err: unknown) => err instanceof AppError && err.code === 'CONFLICT',
    )
  })

  await t.test('overlap on the same slot is rejected', async () => {
    await assert.rejects(
      () => bookingService.create(owner.id, {
        providerId: profile.id,
        serviceId: service.id,
        petId: pet.id,
        start: start.toISOString(),
        end: end.toISOString(),
      }),
      (err: unknown) => err instanceof AppError && err.code === 'CONFLICT',
    )
  })

  await t.test('unconfigured gateway never marks PAID', async () => {
    await bookingService.accept(providerUser.id, bookingRow.id)
    const payment = await paymentService.initiateForOwner(owner.id, bookingRow.id)
    assert.equal(payment.amount, 200000)
    assert.notEqual(payment.status, 'PAID')
    assert.equal(payment.configured, false)
    const again = await paymentService.initiateForOwner(owner.id, bookingRow.id)
    assert.equal(again.id, payment.id)
    const afterCallback = await paymentService.handleCallback({
      paymentId: payment.id,
      status: 'OK',
      actorId: owner.id,
    })
    assert.notEqual(afterCallback.status, 'PAID')
    const [row] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1)
    assert.ok(row)
    assert.notEqual(row.status, 'PAID')
  })

  await t.test('mismatched callback authority is rejected', async () => {
    const [row] = await db.select().from(payments).where(eq(payments.bookingId, bookingRow.id)).limit(1)
    if (!row) return
    await db.update(payments).set({ authority: 'AUTH-A', status: 'PROCESSING' }).where(eq(payments.id, row.id))
    await assert.rejects(
      () => paymentService.handleCallback({
        paymentId: row.id,
        authority: 'AUTH-OTHER',
        status: 'OK',
        actorId: owner.id,
      }),
      (err: unknown) => err instanceof AppError && err.code === 'CONFLICT',
    )
  })

  await t.test('stranger cannot complete someone else payment callback', async () => {
    const [row] = await db.select().from(payments).where(eq(payments.bookingId, bookingRow.id)).limit(1)
    if (!row) return
    await assert.rejects(
      () => paymentService.handleCallback({ paymentId: row.id, actorId: stranger.id, status: 'OK' }),
      (err: unknown) => err instanceof AppError && err.code === 'FORBIDDEN',
    )
  })

  await t.test('cancelled booking cannot be completed or paid', async () => {
    const start2 = new Date('2026-11-03T08:00:00+03:30')
    const end2 = new Date('2026-11-03T09:00:00+03:30')
    const extra = await bookingService.create(owner.id, {
      providerId: profile.id,
      serviceId: service.id,
      petId: pet.id,
      start: start2.toISOString(),
      end: end2.toISOString(),
    })
    await bookingService.cancelAsOwner(owner.id, extra.id, 'انصراف تست')
    await assert.rejects(
      () => bookingService.complete(providerUser.id, extra.id),
      (err: unknown) => err instanceof AppError && err.code === 'CONFLICT',
    )
    await assert.rejects(
      () => paymentService.initiateForOwner(owner.id, extra.id),
      (err: unknown) => err instanceof AppError && err.code === 'CONFLICT',
    )
  })

  await t.test('reports are scoped to the reporter', async () => {
    const report = await reportService.create(owner.id, {
      targetType: 'PROVIDER',
      targetId: profile.id,
      reason: 'OTHER',
      description: 'شرح گزارش آزمایشی برای ایمنی',
    })
    const mine = await reportService.listMine(owner.id)
    assert.ok(mine.some(item => item.id === report.id))
    const theirs = await reportService.listMine(stranger.id)
    assert.equal(theirs.some(item => item.id === report.id), false)
  })

  await t.test('duplicate open dispute is rejected', async () => {
    const start3 = new Date('2026-11-04T08:00:00+03:30')
    const end3 = new Date('2026-11-04T09:00:00+03:30')
    const booked = await bookingService.create(owner.id, {
      providerId: profile.id,
      serviceId: service.id,
      petId: pet.id,
      start: start3.toISOString(),
      end: end3.toISOString(),
    })
    await bookingService.accept(providerUser.id, booked.id)
    await bookingService.disputeAsOwner(owner.id, booked.id, 'اختلاف آزمایشی اول')
    await assert.rejects(
      () => disputeService.open(owner.id, booked.id, 'دوباره', 'ACCEPTED'),
      (err: unknown) => err instanceof AppError && err.code === 'CONFLICT',
    )
    const openRows = await db.select().from(disputes).where(eq(disputes.bookingId, booked.id))
    assert.equal(openRows.filter(r => r.status === 'OPEN' || r.status === 'IN_REVIEW').length, 1)
  })

  await t.test('non-admin cannot run admin mutations', async () => {
    await assert.rejects(
      () => adminService.setUserStatus(owner.id, stranger.id, 'SUSPENDED', 'تلاش غیرمجاز'),
      (err: unknown) => err instanceof AppError && err.code === 'FORBIDDEN',
    )
    await assert.rejects(
      () => disputeService.resolve(owner.id, '11111111-1111-4111-8111-111111111111', 'UPHOLD', 'یادداشت تست'),
      (err: unknown) => err instanceof AppError && err.code === 'FORBIDDEN',
    )
  })

  await t.test('admin can suspend a non-admin', async () => {
    const updated = await adminService.setUserStatus(admin.id, stranger.id, 'SUSPENDED', 'آزمایش تعلیق')
    assert.equal(updated.status, 'SUSPENDED')
  })

  await closeDb()
})
