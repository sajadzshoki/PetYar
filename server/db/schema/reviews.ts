import { pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'
import { providers } from './providers'
import { bookings } from './bookings'

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'restrict' }).unique(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'restrict' }),
  overall: smallint('overall').notNull(),
  communication: smallint('communication').notNull(),
  quality: smallint('quality').notNull(),
  punctuality: smallint('punctuality').notNull(),
  care: smallint('care').notNull(),
  comment: text('comment').notNull(),
  hiddenAt: timestamp('hidden_at', { withTimezone: true }),
  hiddenBy: uuid('hidden_by').references(() => users.id, { onDelete: 'set null' }),
  hideReason: text('hide_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ReviewRow = typeof reviews.$inferSelect
export type FavoriteRow = typeof favorites.$inferSelect
