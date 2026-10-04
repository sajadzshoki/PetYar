import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notificationTypeEnum = pgEnum('notification_type', [
  'BOOKING_REQUEST',
  'BOOKING_ACCEPTED',
  'BOOKING_REJECTED',
  'BOOKING_CANCELLED',
  'PAYMENT_RESULT',
  'NEW_MESSAGE',
  'REVIEW_AVAILABLE',
])

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 160 }).notNull(),
  body: text('body').notNull(),
  href: varchar('href', { length: 255 }),
  entityType: varchar('entity_type', { length: 40 }),
  entityId: uuid('entity_id'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type NotificationRow = typeof notifications.$inferSelect
