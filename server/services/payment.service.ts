import { and, desc, eq, sql } from 'drizzle-orm'
import { getDb } from '../db/client'
import { bookings, paymentTransactions, payments, providers } from '../db/schema'
import type { PaymentRow, PaymentTransactionRow } from '../db/schema/payments'
import { getPaymentGateway, paymentFeeBps } from '../payments'
import { conflict, forbidden, notFound, validationError } from '../utils/errors'
import { logger } from '../utils/logger'
import { notificationService } from './notification.service'
import type { Payment, PaymentGatewayInfo, PaymentTransaction, PaymentWithTransactions, ProviderEarnings } from '../../shared/types/payment'
import { providerService } from './provider.service'
import type { PaymentStatus } from '../../shared/constants/payments'
import { IRR_CURRENCY } from '../../shared/constants/payments'
import { parseIrr, remainingRefundable, splitPlatformFee } from '../../shared/utils/money'
import type { BookingRow } from '../db/schema/bookings'

function irr(value: string | number): number {
  const n = parseIrr(typeof value === 'number' ? value : value)
  if (n == null) throw new Error('مبلغ نامعتبر در پایگاه‌داده')
  return n
}

function toPayment(row: PaymentRow, configured: boolean, redirectUrl: string | null = null): Payment {
  return {
    id: row.id,
    bookingId: row.bookingId,
    ownerId: row.ownerId,
    providerId: row.providerId,
    status: row.status,
    amount: irr(row.amount),
    platformFee: irr(row.platformFee),
    providerPayout: irr(row.providerPayout),
    refundedAmount: irr(row.refundedAmount),
    currency: row.currency,
    driver: row.driver,
    authority: row.authority,
    reference: row.reference,
    redirectUrl,
    configured,
    errorMessage: row.errorMessage,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toTx(row: PaymentTransactionRow): PaymentTransaction {
  return {
    id: row.id,
    paymentId: row.paymentId,
    type: row.type,
    amount: irr(row.amount),
    currency: row.currency,
    status: row.status as PaymentTransaction['status'],
    idempotencyKey: row.idempotencyKey,
    gatewayRef: row.gatewayRef,
    createdAt: row.createdAt.toISOString(),
  }
}

function callbackUrl(paymentId: string) {
  const base = (process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}/payments/return?paymentId=${paymentId}`
}

function lockKey(id: string): number {
  const hex = id.replace(/-/g, '').slice(0, 8)
  return Number.parseInt(hex, 16) % 2147483647
}

async function insertLedger(
  db: { insert: ReturnType<typeof getDb>['insert'] },
  payment: PaymentRow,
  reference: string,
) {
  const amount = irr(payment.amount)
  const fee = irr(payment.platformFee)
  const payout = irr(payment.providerPayout)
  const rows = [
    { type: 'CHARGE' as const, amount, key: `charge:${payment.id}` },
    { type: 'PLATFORM_FEE' as const, amount: fee, key: `fee:${payment.id}` },
    { type: 'PROVIDER_PAYOUT' as const, amount: payout, key: `payout:${payment.id}` },
  ]
  for (const row of rows) {
    await db.insert(paymentTransactions).values({
      paymentId: payment.id,
      type: row.type,
      amount: String(row.amount),
      currency: payment.currency,
      status: 'RECORDED',
      idempotencyKey: row.key,
      gatewayRef: reference,
    }).onConflictDoNothing()
  }
}

export const paymentService = {
  config(): PaymentGatewayInfo {
    const gateway = getPaymentGateway()
    return {
      configured: gateway.configured,
      driver: gateway.id,
      feeBps: paymentFeeBps(),
      reason: gateway.configured ? undefined : (gateway.unavailableReason || 'درگاه پرداخت در دسترس نیست'),
    }
  },

  async getById(id: string): Promise<PaymentRow | null> {
    const db = getDb()
    const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1)
    return row ?? null
  },

  async getForBooking(bookingId: string): Promise<Payment | null> {
    const db = getDb()
    const [row] = await db.select().from(payments).where(eq(payments.bookingId, bookingId)).limit(1)
    if (!row) return null
    return toPayment(row, getPaymentGateway().configured)
  },

  async requireForOwner(userId: string, paymentId: string): Promise<PaymentWithTransactions> {
    const row = await this.getById(paymentId)
    if (!row) throw notFound('پرداخت یافت نشد')
    if (row.ownerId !== userId) throw forbidden()
    return this.withTransactions(row)
  },

  async requireForProvider(providerId: string, paymentId: string): Promise<PaymentWithTransactions> {
    const row = await this.getById(paymentId)
    if (!row || row.providerId !== providerId) throw notFound('پرداخت یافت نشد')
    return this.withTransactions(row)
  },

  async listForProvider(userId: string): Promise<Payment[]> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const rows = await db.select().from(payments)
      .where(eq(payments.providerId, provider.id))
      .orderBy(desc(payments.createdAt))
    const configured = getPaymentGateway().configured
    return rows.map(row => toPayment(row, configured))
  },

  async earningsForProvider(userId: string): Promise<{ earnings: ProviderEarnings, payments: Payment[] }> {
    const items = await this.listForProvider(userId)
    const paid = items.filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_REFUNDED')
    const unpaid = items.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
    const earnings: ProviderEarnings = {
      currency: IRR_CURRENCY,
      grossPaid: paid.reduce((s, p) => s + p.amount, 0),
      platformFees: paid.reduce((s, p) => s + p.platformFee, 0),
      providerEarnings: paid.reduce((s, p) => s + Math.max(0, p.providerPayout - p.refundedAmount), 0),
      refunded: paid.reduce((s, p) => s + p.refundedAmount, 0),
      unpaid: unpaid.reduce((s, p) => s + p.amount, 0),
      paidCount: paid.length,
      unpaidCount: unpaid.length,
    }
    return { earnings, payments: items }
  },

  async withTransactions(row: PaymentRow): Promise<PaymentWithTransactions> {
    const db = getDb()
    const txs = await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.paymentId, row.id))
      .orderBy(desc(paymentTransactions.createdAt))
    return { ...toPayment(row, getPaymentGateway().configured), transactions: txs.map(toTx) }
  },

  async initiateForOwner(userId: string, bookingId: string): Promise<Payment> {
    const gateway = getPaymentGateway()
    const db = getDb()
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${lockKey(bookingId)})`)
      const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
      if (!booking) throw notFound('رزرو یافت نشد')
      if (booking.ownerId !== userId) throw forbidden()
      if (!['ACCEPTED', 'CONFIRMED'].includes(booking.status)) {
        throw conflict('فقط رزرو پذیرفته‌شده یا تأییدشده قابل پرداخت است')
      }
      const gross = parseIrr(booking.totalAmount)
      if (gross == null || gross <= 0) {
        throw validationError({ field: 'amount' }, 'این رزرو مبلغ قابل پرداخت ندارد (توافقی است)')
      }

      const [existing] = await tx.select().from(payments).where(eq(payments.bookingId, bookingId)).limit(1)
      if (existing?.status === 'PAID' || existing?.status === 'REFUNDED' || existing?.status === 'PARTIALLY_REFUNDED') {
        return toPayment(existing, gateway.configured)
      }

      const feeBps = paymentFeeBps()
      const split = splitPlatformFee(gross, feeBps)

      let row = existing
      if (!row) {
        const [created] = await tx.insert(payments).values({
          bookingId,
          ownerId: booking.ownerId,
          providerId: booking.providerId,
          status: 'PENDING',
          amount: String(gross),
          platformFee: String(split.fee),
          providerPayout: String(split.payout),
          refundedAmount: '0',
          feeBps,
          currency: booking.currency || IRR_CURRENCY,
          driver: gateway.id,
          idempotencyKey: `booking:${bookingId}`,
        }).returning()
        if (!created) throw new Error('Failed to create payment')
        row = created
      }
      else {
        const [updated] = await tx.update(payments).set({
          amount: String(gross),
          platformFee: String(split.fee),
          providerPayout: String(split.payout),
          feeBps,
          driver: gateway.id,
          errorMessage: null,
          updatedAt: new Date(),
        }).where(eq(payments.id, row.id)).returning()
        row = updated || row
      }

      if (!gateway.configured) {
        const [pending] = await tx.update(payments).set({
          status: 'PENDING',
          errorMessage: gateway.unavailableReason || 'درگاه پرداخت پیکربندی نشده است',
          updatedAt: new Date(),
        }).where(eq(payments.id, row.id)).returning()
        logger.info('payment_unconfigured', { paymentId: row.id, bookingId })
        return toPayment(pending || row, false)
      }

      const requested = await gateway.requestPayment({
        amount: gross,
        currency: row.currency,
        description: `رزرو پت‌یار ${bookingId}`,
        callbackUrl: callbackUrl(row.id),
        bookingId,
        paymentId: row.id,
      })

      if (!requested.authority || !requested.redirectUrl) {
        const [failed] = await tx.update(payments).set({
          status: 'FAILED',
          errorMessage: requested.message || 'درخواست درگاه ناموفق بود',
          updatedAt: new Date(),
        }).where(eq(payments.id, row.id)).returning()
        return toPayment(failed || row, true)
      }

      const [processing] = await tx.update(payments).set({
        status: 'PROCESSING',
        authority: requested.authority,
        errorMessage: null,
        updatedAt: new Date(),
      }).where(eq(payments.id, row.id)).returning()
      logger.info('payment_processing', { paymentId: row.id, driver: gateway.id })
      return toPayment(processing || row, true, requested.redirectUrl)
    })
  },

  async handleCallback(params: { paymentId?: string, authority?: string, status?: string, actorId: string }): Promise<Payment> {
    const db = getDb()
    const authority = params.authority
    let row: PaymentRow | undefined
    if (params.paymentId) {
      row = (await this.getById(params.paymentId)) ?? undefined
    }
    if (!row && authority) {
      const [found] = await db.select().from(payments).where(eq(payments.authority, authority)).limit(1)
      row = found
    }
    if (!row) throw notFound('پرداخت یافت نشد')
    if (row.ownerId !== params.actorId) throw forbidden()
    if (authority && row.authority && authority !== row.authority) {
      throw conflict('شناسه درگاه با این پرداخت همخوانی ندارد')
    }

    if (row.status === 'PAID' || row.status === 'REFUNDED' || row.status === 'PARTIALLY_REFUNDED') {
      return toPayment(row, getPaymentGateway().configured)
    }

    const okFlag = (params.status || '').toUpperCase()
    if (okFlag && okFlag !== 'OK') {
      return this.markFailed(row, 'پرداخت در درگاه لغو یا رد شد')
    }

    const gateway = getPaymentGateway()
    if (!gateway.configured) {
      return this.markFailed(row, gateway.unavailableReason || 'درگاه پیکربندی نشده است')
    }

    const auth = authority || row.authority
    if (!auth) return this.markFailed(row, 'شناسه درگاه موجود نیست')

    const verified = await gateway.verifyPayment({ authority: auth, amount: irr(row.amount) })
    if (!verified.ok || !verified.reference) {
      return this.markFailed(row, verified.message || 'تأیید پرداخت ناموفق بود')
    }

    return this.markPaid(row, verified.reference)
  },

  async markFailed(row: PaymentRow, message: string): Promise<Payment> {
    const db = getDb()
    const [updated] = await db.update(payments).set({
      status: 'FAILED',
      errorMessage: message,
      updatedAt: new Date(),
    }).where(and(eq(payments.id, row.id), eq(payments.status, row.status))).returning()
    logger.info('payment_failed', { paymentId: row.id })
    await notificationService.notify({
      userId: row.ownerId,
      type: 'PAYMENT_RESULT',
      title: 'پرداخت ناموفق',
      body: message,
      href: `/payments/${row.id}`,
      entityType: 'payment',
      entityId: row.id,
    })
    return toPayment(updated || { ...row, status: 'FAILED', errorMessage: message }, getPaymentGateway().configured)
  },

  async markPaid(row: PaymentRow, reference: string): Promise<Payment> {
    const db = getDb()
    const paid = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${lockKey(row.bookingId)})`)
      const [current] = await tx.select().from(payments).where(eq(payments.id, row.id)).limit(1)
      if (!current) throw notFound('پرداخت یافت نشد')
      if (current.status === 'PAID') return current
      if (current.status !== 'PROCESSING' && current.status !== 'PENDING' && current.status !== 'FAILED') {
        throw conflict('این پرداخت قابل تأیید نیست')
      }
      const [updated] = await tx.update(payments).set({
        status: 'PAID',
        reference,
        paidAt: new Date(),
        errorMessage: null,
        updatedAt: new Date(),
      }).where(eq(payments.id, row.id)).returning()
      if (!updated) throw conflict('وضعیت پرداخت تغییر کرده است')
      await insertLedger(tx, updated, reference)
      return updated
    })
    logger.info('payment_paid', { paymentId: paid.id, bookingId: paid.bookingId })
    await notificationService.notify({
      userId: paid.ownerId,
      type: 'PAYMENT_RESULT',
      title: 'پرداخت تأیید شد',
      body: 'مبلغ رزرو با موفقیت ثبت شد.',
      href: `/payments/${paid.id}`,
      entityType: 'payment',
      entityId: paid.id,
    })
    const db2 = getDb()
    const [prov] = await db2.select({ userId: providers.userId }).from(providers).where(eq(providers.id, paid.providerId)).limit(1)
    if (prov) {
      await notificationService.notify({
        userId: prov.userId,
        type: 'PAYMENT_RESULT',
        title: 'پرداخت رزرو دریافت شد',
        body: 'پرداخت مشتری تأیید شد.',
        href: `/provider/bookings/${paid.bookingId}`,
        entityType: 'payment',
        entityId: paid.id,
      })
    }
    return toPayment(paid, true)
  },

  async refundForOwner(userId: string, paymentId: string, amount: number | null, reason: string): Promise<Payment> {
    const row = await this.getById(paymentId)
    if (!row) throw notFound('پرداخت یافت نشد')
    if (row.ownerId !== userId) throw forbidden()
    return this.refund(row, amount, reason)
  },

  async refundForBookingCancel(booking: BookingRow) {
    const db = getDb()
    const [row] = await db.select().from(payments).where(eq(payments.bookingId, booking.id)).limit(1)
    if (!row) return
    if (row.status !== 'PAID' && row.status !== 'PARTIALLY_REFUNDED') return
    try {
      await this.refund(row, null, 'لغو رزرو')
    }
    catch (error) {
      logger.warn('payment_refund_on_cancel_deferred', {
        paymentId: row.id,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  },

  async refund(row: PaymentRow, requested: number | null, reason: string): Promise<Payment> {
    if (row.status !== 'PAID' && row.status !== 'PARTIALLY_REFUNDED') {
      throw conflict('فقط پرداخت موفق قابل بازپرداخت است')
    }
    const gross = irr(row.amount)
    const already = irr(row.refundedAmount)
    const max = remainingRefundable(gross, already)
    if (max <= 0) throw conflict('مبلغی برای بازپرداخت نمانده است')
    const amount = requested == null ? max : requested
    if (!Number.isInteger(amount) || amount <= 0) {
      throw validationError({ field: 'amount' }, 'مبلغ بازپرداخت نامعتبر است')
    }
    if (amount > max) {
      throw validationError({ field: 'amount' }, 'مبلغ بازپرداخت از مانده بیشتر است')
    }

    const gateway = getPaymentGateway()
    if (!gateway.configured) {
      throw conflict(gateway.unavailableReason || 'بدون درگاه پیکربندی‌شده نمی‌توان بازپرداخت ثبت کرد')
    }

    const result = await gateway.refundPayment({
      authority: row.authority,
      reference: row.reference,
      amount,
    })
    if (!result.ok) {
      throw conflict(result.message || 'درگاه بازپرداخت را انجام نداد')
    }

    const db = getDb()
    const nextRefunded = already + amount
    const nextStatus: PaymentStatus = nextRefunded >= gross ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
    const updated = await db.transaction(async (tx) => {
      await tx.insert(paymentTransactions).values({
        paymentId: row.id,
        type: 'REFUND',
        amount: String(amount),
        currency: row.currency,
        status: 'RECORDED',
        idempotencyKey: `refund:${row.id}:${nextRefunded}`,
        gatewayRef: result.reference,
        note: reason,
      })
      const [pay] = await tx.update(payments).set({
        status: nextStatus,
        refundedAmount: String(nextRefunded),
        updatedAt: new Date(),
      }).where(eq(payments.id, row.id)).returning()
      return pay
    })
    logger.info('payment_refunded', { paymentId: row.id, amount, status: nextStatus })
    return toPayment(updated || row, true)
  },

  isSettled(payment: Payment | null, bookingAmount: number | null) {
    if (bookingAmount == null || bookingAmount <= 0) return true
    return payment?.status === 'PAID' || payment?.status === 'PARTIALLY_REFUNDED'
  },
}
