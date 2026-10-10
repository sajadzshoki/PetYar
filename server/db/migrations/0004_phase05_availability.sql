CREATE TYPE "availability_exception_kind" AS ENUM ('BLOCK', 'OPEN');

CREATE TABLE "availability_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
  "weekday" smallint NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "availability_rules_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "availability_rules_time_check" CHECK ("end_time" > "start_time")
);

CREATE INDEX "availability_rules_provider_idx" ON "availability_rules" ("provider_id", "weekday");

CREATE TABLE "availability_exceptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "kind" "availability_exception_kind" NOT NULL,
  "start_time" time,
  "end_time" time,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "availability_exceptions_provider_date_idx" ON "availability_exceptions" ("provider_id", "date");
