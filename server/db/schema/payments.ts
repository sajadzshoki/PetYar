import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { bookings } from './bookings'
import { users } from './users'
import { providers } from './providers'

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
])

export const paymentTransactionTypeEnum = pgEnum('payment_transaction_type', [
  'CHARGE',
  'PLATFORM_FEE',
  'PROVIDER_PAYOUT',
  'REFUND',
])

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'restrict' }).unique(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'restrict' }),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  amount: numeric('amount', { precision: 12, scale: 0 }).notNull(),
  platformFee: numeric('platform_fee', { precision: 12, scale: 0 }).notNull(),
  providerPayout: numeric('provider_payout', { precision: 12, scale: 0 }).notNull(),
  refundedAmount: numeric('refunded_amount', { precision: 12, scale: 0 }).notNull().default('0'),
  feeBps: integer('fee_bps').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('IRR'),
  driver: varchar('driver', { length: 32 }).notNull(),
  authority: varchar('authority', { length: 128 }),
  reference: varchar('reference', { length: 128 }),
  idempotencyKey: varchar('idempotency_key', { length: 80 }).notNull().unique(),
  errorMessage: text('error_message'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  type: paymentTransactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 0 }).notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('IRR'),
  status: varchar('status', { length: 24 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 120 }).notNull().unique(),
  gatewayRef: varchar('gateway_ref', { length: 128 }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PaymentRow = typeof payments.$inferSelect
export type PaymentTransactionRow = typeof paymentTransactions.$inferSelect
