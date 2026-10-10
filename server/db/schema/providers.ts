import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

export const pricingTypeEnum = pgEnum('pricing_type', ['HOURLY', 'DAILY', 'FIXED', 'PER_VISIT', 'CUSTOM'])

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 80 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const providers = pgTable('providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  displayName: varchar('display_name', { length: 80 }).notNull(),
  bio: text('bio'),
  experienceYears: integer('experience_years'),
  experience: text('experience'),
  photoKey: varchar('photo_key', { length: 255 }),
  serviceArea: varchar('service_area', { length: 300 }),
  city: varchar('city', { length: 80 }),
  district: varchar('district', { length: 80 }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  serviceRadiusKm: numeric('service_radius_km', { precision: 6, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  verificationStatus: varchar('verification_status', { length: 24 }).notNull().default('UNVERIFIED'),
  verificationNote: text('verification_note'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const providerGallery = pgTable('provider_gallery', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  imageKey: varchar('image_key', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const providerServices = pgTable('provider_services', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => serviceCategories.id),
  title: varchar('title', { length: 120 }).notNull(),
  description: text('description'),
  pricingType: pricingTypeEnum('pricing_type').notNull(),
  price: numeric('price', { precision: 12, scale: 0 }),
  durationMinutes: integer('duration_minutes'),
  capacity: integer('capacity').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ProviderRow = typeof providers.$inferSelect
export type GalleryRow = typeof providerGallery.$inferSelect
export type ProviderServiceRow = typeof providerServices.$inferSelect
export type CategoryRow = typeof serviceCategories.$inferSelect
