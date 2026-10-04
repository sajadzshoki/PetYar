CREATE TYPE "payment_status" AS ENUM (
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);

CREATE TYPE "payment_transaction_type" AS ENUM (
  'CHARGE',
  'PLATFORM_FEE',
  'PROVIDER_PAYOUT',
  'REFUND'
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE RESTRICT,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE RESTRICT,
  "status" "payment_status" NOT NULL DEFAULT 'PENDING',
  "amount" numeric(12, 0) NOT NULL,
  "platform_fee" numeric(12, 0) NOT NULL,
  "provider_payout" numeric(12, 0) NOT NULL,
  "refunded_amount" numeric(12, 0) NOT NULL DEFAULT 0,
  "fee_bps" integer NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'IRR',
  "driver" varchar(32) NOT NULL,
  "authority" varchar(128),
  "reference" varchar(128),
  "idempotency_key" varchar(80) NOT NULL,
  "error_message" text,
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payments_booking_id_unique" UNIQUE ("booking_id"),
  CONSTRAINT "payments_idempotency_key_unique" UNIQUE ("idempotency_key"),
  CONSTRAINT "payments_amount_check" CHECK ("amount" >= 0 AND "platform_fee" >= 0 AND "provider_payout" >= 0 AND "refunded_amount" >= 0)
);

CREATE INDEX "payments_owner_idx" ON "payments" ("owner_id");
CREATE INDEX "payments_provider_idx" ON "payments" ("provider_id");
CREATE INDEX "payments_authority_idx" ON "payments" ("authority");

CREATE TABLE "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payment_id" uuid NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
  "type" "payment_transaction_type" NOT NULL,
  "amount" numeric(12, 0) NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'IRR',
  "status" varchar(24) NOT NULL,
  "idempotency_key" varchar(120) NOT NULL,
  "gateway_ref" varchar(128),
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payment_transactions_idempotency_key_unique" UNIQUE ("idempotency_key"),
  CONSTRAINT "payment_transactions_amount_check" CHECK ("amount" >= 0)
);

CREATE INDEX "payment_transactions_payment_idx" ON "payment_transactions" ("payment_id", "created_at");
