import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'
import { pets } from './pets'
import { providers, providerServices } from './providers'

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
])

export const cancelledByEnum = pgEnum('booking_cancelled_by', ['OWNER', 'PROVIDER'])

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'restrict' }),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'restrict' }),
  serviceId: uuid('service_id').notNull().references(() => providerServices.id, { onDelete: 'restrict' }),
  status: bookingStatusEnum('status').notNull().default('PENDING'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('Asia/Tehran'),
  pricingType: varchar('pricing_type', { length: 24 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 0 }),
  durationMinutes: integer('duration_minutes').notNull(),
  units: integer('units').notNull().default(1),
  totalAmount: numeric('total_amount', { precision: 12, scale: 0 }),
  currency: varchar('currency', { length: 8 }).notNull().default('IRR'),
  ownerNote: text('owner_note'),
  providerNote: text('provider_note'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: cancelledByEnum('cancelled_by'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type BookingRow = typeof bookings.$inferSelect
