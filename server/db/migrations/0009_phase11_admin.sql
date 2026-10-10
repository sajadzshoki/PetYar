CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
ALTER TABLE "users" ADD COLUMN "status" "user_status" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "providers" ADD COLUMN "verification_status" varchar(24) NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "providers" ADD COLUMN "verification_note" text;
ALTER TABLE "providers" ADD COLUMN "verified_at" timestamp with time zone;

ALTER TABLE "reviews" ADD COLUMN "hidden_at" timestamp with time zone;
ALTER TABLE "reviews" ADD COLUMN "hidden_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "reviews" ADD COLUMN "hide_reason" text;

ALTER TYPE "notification_type" ADD VALUE 'VERIFICATION_UPDATE';
ALTER TYPE "notification_type" ADD VALUE 'ACCOUNT_STATUS';
ALTER TYPE "notification_type" ADD VALUE 'DISPUTE_UPDATE';
ALTER TYPE "notification_type" ADD VALUE 'REPORT_UPDATE';

CREATE TYPE "verification_status" AS ENUM (
  'UNVERIFIED',
  'PENDING',
  'NEEDS_CHANGES',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "verification_document_kind" AS ENUM (
  'NATIONAL_ID',
  'SELFIE',
  'BUSINESS_LICENSE',
  'OTHER'
);

CREATE TYPE "report_target_type" AS ENUM ('USER', 'PROVIDER', 'BOOKING', 'REVIEW');
CREATE TYPE "report_reason" AS ENUM ('SPAM', 'HARASSMENT', 'SCAM', 'INAPPROPRIATE', 'SAFETY', 'OTHER');
CREATE TYPE "report_status" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE "dispute_status" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE "dispute_resolution" AS ENUM ('UPHOLD', 'CANCEL_BOOKING', 'COMPLETE_BOOKING', 'REFUND_RECOMMENDED');

CREATE TABLE "verification_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
  "status" "verification_status" NOT NULL DEFAULT 'UNVERIFIED',
  "legal_name" varchar(120) NOT NULL DEFAULT '',
  "national_id" varchar(10) NOT NULL DEFAULT '',
  "city" varchar(80),
  "notes" text,
  "review_note" text,
  "submitted_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "verification_applications_provider_idx" ON "verification_applications" ("provider_id", "created_at" DESC);
CREATE INDEX "verification_applications_status_idx" ON "verification_applications" ("status", "submitted_at" DESC);

CREATE TABLE "verification_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "verification_applications"("id") ON DELETE CASCADE,
  "kind" "verification_document_kind" NOT NULL,
  "image_key" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "target_type" "report_target_type" NOT NULL,
  "target_id" uuid NOT NULL,
  "reason" "report_reason" NOT NULL,
  "description" text NOT NULL,
  "status" "report_status" NOT NULL DEFAULT 'OPEN',
  "resolution_note" text,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "reports_status_idx" ON "reports" ("status", "created_at" DESC);
CREATE INDEX "reports_reporter_idx" ON "reports" ("reporter_id", "created_at" DESC);

CREATE TABLE "disputes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE RESTRICT,
  "opened_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "reason" text NOT NULL,
  "status" "dispute_status" NOT NULL DEFAULT 'OPEN',
  "previous_status" varchar(24) NOT NULL,
  "resolution" "dispute_resolution",
  "admin_note" text,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "disputes_status_idx" ON "disputes" ("status", "created_at" DESC);
CREATE INDEX "disputes_booking_idx" ON "disputes" ("booking_id");

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" varchar(80) NOT NULL,
  "entity_type" varchar(40) NOT NULL,
  "entity_id" uuid,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "audit_logs_created_idx" ON "audit_logs" ("created_at" DESC);
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" ("entity_type", "entity_id");
