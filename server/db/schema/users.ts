import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['OWNER', 'PROVIDER', 'ADMIN'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 80 }).notNull(),
  firstName: varchar('first_name', { length: 60 }).notNull().default(''),
  lastName: varchar('last_name', { length: 60 }).notNull().default(''),
  phone: varchar('phone', { length: 20 }),
  bio: text('bio'),
  avatarKey: varchar('avatar_key', { length: 255 }),
  role: userRoleEnum('role').notNull().default('OWNER'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
