import { boolean, date, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

export const petTypeEnum = pgEnum('pet_type', ['DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'OTHER'])
export const petGenderEnum = pgEnum('pet_gender', ['MALE', 'FEMALE', 'UNKNOWN'])

export const pets = pgTable('pets', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 80 }).notNull(),
  type: petTypeEnum('type').notNull(),
  breed: varchar('breed', { length: 80 }),
  gender: petGenderEnum('gender').notNull().default('UNKNOWN'),
  birthDate: date('birth_date'),
  weightKg: numeric('weight_kg', { precision: 6, scale: 2 }),
  photoKey: varchar('photo_key', { length: 255 }),
  behaviorNotes: text('behavior_notes'),
  allergies: text('allergies'),
  medicalNotes: text('medical_notes'),
  neutered: boolean('neutered').notNull().default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const petVaccinations = pgTable('pet_vaccinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  administeredOn: date('administered_on').notNull(),
  nextDueOn: date('next_due_on'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const petMedications = pgTable('pet_medications', {
  id: uuid('id').defaultRandom().primaryKey(),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  dosage: varchar('dosage', { length: 80 }),
  frequency: varchar('frequency', { length: 80 }),
  startedOn: date('started_on'),
  endedOn: date('ended_on'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const petCareNotes = pgTable('pet_care_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PetRow = typeof pets.$inferSelect
export type VaccinationRow = typeof petVaccinations.$inferSelect
export type MedicationRow = typeof petMedications.$inferSelect
export type CareNoteRow = typeof petCareNotes.$inferSelect
