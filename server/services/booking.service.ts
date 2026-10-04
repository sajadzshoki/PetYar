import { and, desc, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm'
import { getDb } from '../db/client'
import { bookings, pets, providerServices, providers } from '../db/schema'
import type { BookingRow } from '../db/schema/bookings'
import { availabilityService } from './availability.service'
import { providerService } from './provider.service'
import { conflict, forbidden, notFound, validationError } from '../utils/errors'
import { logger } from '../utils/logger'
import {
  BOOKING_BUSY_STATUSES,
  BOOKING_CURRENCY,
  type BookingStatus,
  type CancelledBy,
} from '../../shared/constants/bookings'
import { PROVIDER_TIMEZONE } from '../../shared/constants/availability'
import type { PricingType } from '../../shared/constants/providers'
import type { Booking, BookingQuote } from '../../shared/types/booking'
import type { BookingCreateInput } from '../../shared/validation/booking'
import { quotePrice } from '../../shared/utils/pricing'
import { paymentService } from './payment.service'
import { parseIrr } from '../../shared/utils/money'

type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0]

function money(value: string | null): number | null {
  if (value === null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toBooking(
  row: BookingRow,
  extras: { petName: string, providerName: string, serviceTitle: string, payment: Booking['payment'] },
): Booking {
  const unitPrice = money(row.unitPrice)
  return {
    id: row.id,
    ownerId: row.ownerId,
    petId: row.petId,
    petName: extras.petName,
    providerId: row.providerId,
    providerName: extras.providerName,
    serviceId: row.serviceId,
    serviceTitle: extras.serviceTitle,
    status: row.status,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    timezone: row.timezone,
    pricingType: row.pricingType as PricingType,
    unitPrice,
    durationMinutes: row.durationMinutes,
    units: row.units,
    totalAmount: money(row.totalAmount),
    currency: row.currency,
    negotiable: row.pricingType === 'CUSTOM' || unitPrice == null,
    ownerNote: row.ownerNote,
    providerNote: row.providerNote,
    cancellationReason: row.cancellationReason,
    cancelledBy: row.cancelledBy,
    cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    payment: extras.payment,
  }
}

async function hydrate(row: BookingRow): Promise<Booking> {
  const db = getDb()
  const [[pet], [provider], [service], payment] = await Promise.all([
    db.select({ name: pets.name }).from(pets).where(eq(pets.id, row.petId)).limit(1),
    db.select({ displayName: providers.displayName }).from(providers).where(eq(providers.id, row.providerId)).limit(1),
    db.select({ title: providerServices.title }).from(providerServices).where(eq(providerServices.id, row.serviceId)).limit(1),
    paymentService.getForBooking(row.id),
  ])
  return toBooking(row, {
    petName: pet?.name || '',
    providerName: provider?.displayName || '',
    serviceTitle: service?.title || '',
    payment,
  })
}

async function requirePaidIfPriced(row: BookingRow) {
  const amount = parseIrr(row.totalAmount)
  if (amount == null || amount <= 0) return
  const payment = await paymentService.getForBooking(row.id)
  if (!paymentService.isSettled(payment, amount)) {
    throw conflict('تا پرداخت تأیید نشود این مرحله ممکن نیست')
  }
}

function assertTransition(from: BookingStatus, to: BookingStatus, allowed: BookingStatus[]) {
  if (from !== to && !allowed.includes(from)) {
    throw conflict(`این رزرو در وضعیت «${from}» قابل تغییر به «${to}» نیست`)
  }
}

async function overlappingCount(
  db: Tx | ReturnType<typeof getDb>,
  providerId: string,
  start: Date,
  end: Date,
  exceptId?: string,
) {
  const filters = [
    eq(bookings.providerId, providerId),
    inArray(bookings.status, BOOKING_BUSY_STATUSES),
    lt(bookings.startAt, end),
    gt(bookings.endAt, start),
  ]
  if (exceptId) filters.push(ne(bookings.id, exceptId))
  const rows = await db.select({ id: bookings.id, serviceId: bookings.serviceId }).from(bookings).where(and(...filters))
  return rows
}

function lockKey(providerId: string): number {
  const hex = providerId.replace(/-/g, '').slice(0, 8)
  return Number.parseInt(hex, 16) % 2147483647
}

export const bookingService = {
  async quote(providerId: string, serviceId: string, startIso: string, endIso: string): Promise<BookingQuote> {
    const start = new Date(startIso)
    const end = new Date(endIso)
    const db = getDb()
    const [provider] = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1)
    if (!provider || !provider.isActive) throw notFound('ارائه‌دهنده یافت نشد')
    const [service] = await db.select().from(providerServices).where(and(
      eq(providerServices.id, serviceId),
      eq(providerServices.providerId, providerId),
    )).limit(1)
    if (!service || !service.isActive) throw notFound('خدمت یافت نشد')

    const check = await availabilityService.check(providerId, startIso, endIso)
    const overlaps = await overlappingCount(db, providerId, start, end)
    const sameService = overlaps.filter(o => o.serviceId === serviceId).length
    const otherService = overlaps.some(o => o.serviceId !== serviceId)
    const capacity = service.capacity || 1
    let available = check.available
    let reason = check.reason
    if (otherService || sameService >= capacity) {
      available = false
      reason = 'این بازه قبلاً رزرو شده است'
    }

    const unitPrice = service.price == null ? null : Number(service.price)
    const priced = quotePrice(service.pricingType, Number.isFinite(unitPrice as number) ? unitPrice : null, start, end)
    return {
      timezone: PROVIDER_TIMEZONE,
      available,
      reason: available ? undefined : reason,
      pricingType: priced.pricingType,
      unitPrice: priced.unitPrice,
      durationMinutes: priced.durationMinutes,
      units: priced.units,
      totalAmount: priced.totalAmount,
      negotiable: priced.negotiable,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    }
  },

  async create(userId: string, input: BookingCreateInput): Promise<Booking> {
    const start = new Date(input.start)
    const end = new Date(input.end)
    if (start.getTime() < Date.now() - 60_000) {
      throw validationError({ field: 'start' }, 'زمان رزرو نباید در گذشته باشد')
    }

    const db = getDb()
    const created = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${lockKey(input.providerId)})`)

      const [provider] = await tx.select().from(providers).where(eq(providers.id, input.providerId)).limit(1)
      if (!provider || !provider.isActive) throw notFound('ارائه‌دهنده یافت نشد')
      if (provider.userId === userId) throw forbidden('نمی‌توانید برای خودتان رزرو ثبت کنید')

      const [service] = await tx.select().from(providerServices).where(and(
        eq(providerServices.id, input.serviceId),
        eq(providerServices.providerId, input.providerId),
      )).limit(1)
      if (!service || !service.isActive) throw notFound('خدمت یافت نشد')

      const [pet] = await tx.select().from(pets).where(eq(pets.id, input.petId)).limit(1)
      if (!pet) throw notFound('حیوان یافت نشد')
      if (pet.ownerId !== userId) throw forbidden('این حیوان متعلق به شما نیست')
      if (pet.archivedAt) throw validationError({ field: 'petId' }, 'حیوان بایگانی‌شده قابل رزرو نیست')

      const check = await availabilityService.check(input.providerId, input.start, input.end)
      if (!check.available) {
        throw conflict(check.reason || 'ارائه‌دهنده در این بازه آزاد نیست')
      }

      const overlaps = await overlappingCount(tx, input.providerId, start, end)
      const capacity = service.capacity || 1
      if (overlaps.some(o => o.serviceId !== service.id) || overlaps.filter(o => o.serviceId === service.id).length >= capacity) {
        throw conflict('این بازه قبلاً رزرو شده است')
      }

      const unitPrice = service.price == null ? null : Number(service.price)
      const priced = quotePrice(service.pricingType, Number.isFinite(unitPrice as number) ? unitPrice : null, start, end)
      const [row] = await tx.insert(bookings).values({
        ownerId: userId,
        petId: pet.id,
        providerId: provider.id,
        serviceId: service.id,
        status: 'PENDING',
        startAt: start,
        endAt: end,
        timezone: PROVIDER_TIMEZONE,
        pricingType: service.pricingType,
        unitPrice: priced.unitPrice == null ? null : String(priced.unitPrice),
        durationMinutes: priced.durationMinutes,
        units: priced.units || 1,
        totalAmount: priced.totalAmount == null ? null : String(priced.totalAmount),
        currency: BOOKING_CURRENCY,
        ownerNote: input.note?.trim() || null,
      }).returning()
      if (!row) throw new Error('Failed to create booking')
      return row
    })

    logger.info('booking_created', { bookingId: created.id, ownerId: userId, providerId: created.providerId })
    return hydrate(created)
  },

  async listMine(userId: string): Promise<Booking[]> {
    const db = getDb()
    const rows = await db.select().from(bookings).where(eq(bookings.ownerId, userId)).orderBy(desc(bookings.createdAt))
    return Promise.all(rows.map(hydrate))
  },

  async listForProvider(userId: string): Promise<Booking[]> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const rows = await db.select().from(bookings).where(eq(bookings.providerId, provider.id)).orderBy(desc(bookings.createdAt))
    return Promise.all(rows.map(hydrate))
  },

  async getForOwner(userId: string, id: string): Promise<Booking> {
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (!row) throw notFound('رزرو یافت نشد')
    if (row.ownerId !== userId) throw forbidden()
    return hydrate(row)
  },

  async getForProvider(userId: string, id: string): Promise<Booking> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (!row || row.providerId !== provider.id) throw notFound('رزرو یافت نشد')
    return hydrate(row)
  },

  async accept(userId: string, id: string, note?: string) {
    return this.providerTransition(userId, id, 'ACCEPTED', ['PENDING'], { providerNote: note })
  },

  async reject(userId: string, id: string, reason?: string) {
    return this.providerTransition(userId, id, 'REJECTED', ['PENDING'], {
      providerNote: reason || null,
      cancellationReason: reason || null,
    })
  },

  async confirmAsProvider(userId: string, id: string) {
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (row) await requirePaidIfPriced(row)
    return this.providerTransition(userId, id, 'CONFIRMED', ['ACCEPTED'])
  },

  async confirmAsOwner(userId: string, id: string) {
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (row) await requirePaidIfPriced(row)
    return this.ownerTransition(userId, id, 'CONFIRMED', ['ACCEPTED'])
  },

  async start(userId: string, id: string) {
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (row) await requirePaidIfPriced(row)
    return this.providerTransition(userId, id, 'IN_PROGRESS', ['CONFIRMED'])
  },

  async complete(userId: string, id: string) {
    return this.providerTransition(userId, id, 'COMPLETED', ['IN_PROGRESS'])
  },

  async disputeAsOwner(userId: string, id: string, reason: string) {
    return this.ownerTransition(userId, id, 'DISPUTED', ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'], {
      cancellationReason: reason,
    })
  },

  async disputeAsProvider(userId: string, id: string, reason: string) {
    return this.providerTransition(userId, id, 'DISPUTED', ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'], {
      cancellationReason: reason,
    })
  },

  async cancelAsOwner(userId: string, id: string, reason: string) {
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (!row) throw notFound('رزرو یافت نشد')
    if (row.ownerId !== userId) throw forbidden()
    if (row.status === 'PENDING') {
      return this.applyCancel(row, 'OWNER', reason)
    }
    if (row.status === 'ACCEPTED' || row.status === 'CONFIRMED') {
      if (row.startAt.getTime() <= Date.now()) {
        throw conflict('پس از شروع زمان خدمت، لغو از سمت صاحب حیوان ممکن نیست')
      }
      return this.applyCancel(row, 'OWNER', reason)
    }
    throw conflict('این رزرو قابل لغو نیست')
  },

  async cancelAsProvider(userId: string, id: string, reason: string) {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (!row || row.providerId !== provider.id) throw notFound('رزرو یافت نشد')
    if (!['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(row.status)) {
      throw conflict('این رزرو از سمت ارائه‌دهنده قابل لغو نیست')
    }
    return this.applyCancel(row, 'PROVIDER', reason)
  },

  async applyCancel(row: BookingRow, by: CancelledBy, reason: string) {
    const db = getDb()
    const [updated] = await db.update(bookings).set({
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledBy: by,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(bookings.id, row.id), eq(bookings.status, row.status))).returning()
    if (!updated) throw conflict('وضعیت رزرو تغییر کرده است')
    await paymentService.refundForBookingCancel(row)
    logger.info('booking_cancelled', { bookingId: row.id, by })
    return hydrate(updated)
  },

  async ownerTransition(
    userId: string,
    id: string,
    to: BookingStatus,
    from: BookingStatus[],
    extra: Partial<Pick<BookingRow, 'cancellationReason' | 'ownerNote'>> = {},
  ) {
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (!row) throw notFound('رزرو یافت نشد')
    if (row.ownerId !== userId) throw forbidden()
    assertTransition(row.status, to, from)
    const [updated] = await db.update(bookings).set({
      status: to,
      ...extra,
      updatedAt: new Date(),
    }).where(and(eq(bookings.id, id), eq(bookings.status, row.status))).returning()
    if (!updated) throw conflict('وضعیت رزرو تغییر کرده است')
    return hydrate(updated)
  },

  async providerTransition(
    userId: string,
    id: string,
    to: BookingStatus,
    from: BookingStatus[],
    extra: Partial<Pick<BookingRow, 'cancellationReason' | 'providerNote'>> = {},
  ) {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (!row || row.providerId !== provider.id) throw notFound('رزرو یافت نشد')
    assertTransition(row.status, to, from)
    const [updated] = await db.update(bookings).set({
      status: to,
      ...extra,
      updatedAt: new Date(),
    }).where(and(eq(bookings.id, id), eq(bookings.status, row.status))).returning()
    if (!updated) throw conflict('وضعیت رزرو تغییر کرده است')
    logger.info('booking_transition', { bookingId: id, to })
    return hydrate(updated)
  },
}
