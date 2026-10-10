import { boolean, date, pgEnum, pgTable, smallint, text, time, timestamp, uuid } from 'drizzle-orm/pg-core'
import { providers } from './providers'

export const exceptionKindEnum = pgEnum('availability_exception_kind', ['BLOCK', 'OPEN'])

export const availabilityRules = pgTable('availability_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  weekday: smallint('weekday').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const availabilityExceptions = pgTable('availability_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  kind: exceptionKindEnum('kind').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type AvailabilityRuleRow = typeof availabilityRules.$inferSelect
export type AvailabilityExceptionRow = typeof availabilityExceptions.$inferSelect
