CREATE TYPE "booking_status" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED'
);

CREATE TYPE "booking_cancelled_by" AS ENUM ('OWNER', 'PROVIDER');

CREATE TABLE "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "pet_id" uuid NOT NULL REFERENCES "pets"("id") ON DELETE RESTRICT,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE RESTRICT,
  "service_id" uuid NOT NULL REFERENCES "provider_services"("id") ON DELETE RESTRICT,
  "status" "booking_status" NOT NULL DEFAULT 'PENDING',
  "start_at" timestamp with time zone NOT NULL,
  "end_at" timestamp with time zone NOT NULL,
  "timezone" varchar(64) NOT NULL DEFAULT 'Asia/Tehran',
  "pricing_type" varchar(24) NOT NULL,
  "unit_price" numeric(12, 0),
  "duration_minutes" integer NOT NULL,
  "units" integer NOT NULL DEFAULT 1,
  "total_amount" numeric(12, 0),
  "currency" varchar(8) NOT NULL DEFAULT 'IRR',
  "owner_note" text,
  "provider_note" text,
  "cancellation_reason" text,
  "cancelled_by" "booking_cancelled_by",
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "bookings_time_check" CHECK ("end_at" > "start_at")
);

CREATE INDEX "bookings_owner_idx" ON "bookings" ("owner_id", "created_at" DESC);
CREATE INDEX "bookings_provider_idx" ON "bookings" ("provider_id", "start_at");
CREATE INDEX "bookings_status_idx" ON "bookings" ("status");
