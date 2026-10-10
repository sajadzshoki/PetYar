import { jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'
import { providers } from './providers'
import { bookings } from './bookings'

export const verificationStatusEnum = pgEnum('verification_status', [
  'UNVERIFIED',
  'PENDING',
  'NEEDS_CHANGES',
  'APPROVED',
  'REJECTED',
])

export const verificationDocumentKindEnum = pgEnum('verification_document_kind', [
  'NATIONAL_ID',
  'SELFIE',
  'BUSINESS_LICENSE',
  'OTHER',
])

export const reportTargetTypeEnum = pgEnum('report_target_type', [
  'USER',
  'PROVIDER',
  'BOOKING',
  'REVIEW',
])

export const reportReasonEnum = pgEnum('report_reason', [
  'SPAM',
  'HARASSMENT',
  'SCAM',
  'INAPPROPRIATE',
  'SAFETY',
  'OTHER',
])

export const reportStatusEnum = pgEnum('report_status', [
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'DISMISSED',
])

export const disputeStatusEnum = pgEnum('dispute_status', [
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'DISMISSED',
])

export const disputeResolutionEnum = pgEnum('dispute_resolution', [
  'UPHOLD',
  'CANCEL_BOOKING',
  'COMPLETE_BOOKING',
  'REFUND_RECOMMENDED',
])

export const verificationApplications = pgTable('verification_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  status: verificationStatusEnum('status').notNull().default('UNVERIFIED'),
  legalName: varchar('legal_name', { length: 120 }).notNull().default(''),
  nationalId: varchar('national_id', { length: 10 }).notNull().default(''),
  city: varchar('city', { length: 80 }),
  notes: text('notes'),
  reviewNote: text('review_note'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const verificationDocuments = pgTable('verification_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => verificationApplications.id, { onDelete: 'cascade' }),
  kind: verificationDocumentKindEnum('kind').notNull(),
  imageKey: varchar('image_key', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  targetType: reportTargetTypeEnum('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: reportReasonEnum('reason').notNull(),
  description: text('description').notNull(),
  status: reportStatusEnum('status').notNull().default('OPEN'),
  resolutionNote: text('resolution_note'),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const disputes = pgTable('disputes', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'restrict' }),
  openedByUserId: uuid('opened_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  reason: text('reason').notNull(),
  status: disputeStatusEnum('status').notNull().default('OPEN'),
  previousStatus: varchar('previous_status', { length: 24 }).notNull(),
  resolution: disputeResolutionEnum('resolution'),
  adminNote: text('admin_note'),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 80 }).notNull(),
  entityType: varchar('entity_type', { length: 40 }).notNull(),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type VerificationApplicationRow = typeof verificationApplications.$inferSelect
export type VerificationDocumentRow = typeof verificationDocuments.$inferSelect
export type ReportRow = typeof reports.$inferSelect
export type DisputeRow = typeof disputes.$inferSelect
export type AuditLogRow = typeof auditLogs.$inferSelect
