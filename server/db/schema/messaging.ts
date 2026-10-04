import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'
import { bookings } from './bookings'
import { providers } from './providers'

export const conversationKindEnum = pgEnum('conversation_kind', ['INQUIRY', 'BOOKING'])

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: conversationKindEnum('kind').notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }).unique(),
  providerId: uuid('provider_id').references(() => providers.id, { onDelete: 'set null' }),
  pairKey: varchar('pair_key', { length: 80 }).unique(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const conversationParticipants = pgTable('conversation_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  body: text('body'),
  attachmentKey: varchar('attachment_key', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ConversationRow = typeof conversations.$inferSelect
export type ParticipantRow = typeof conversationParticipants.$inferSelect
export type MessageRow = typeof messages.$inferSelect
