CREATE TABLE "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE RESTRICT,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE RESTRICT,
  "overall" smallint NOT NULL,
  "communication" smallint NOT NULL,
  "quality" smallint NOT NULL,
  "punctuality" smallint NOT NULL,
  "care" smallint NOT NULL,
  "comment" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "reviews_booking_id_unique" UNIQUE ("booking_id"),
  CONSTRAINT "reviews_scores_check" CHECK (
    "overall" BETWEEN 1 AND 5
    AND "communication" BETWEEN 1 AND 5
    AND "quality" BETWEEN 1 AND 5
    AND "punctuality" BETWEEN 1 AND 5
    AND "care" BETWEEN 1 AND 5
  )
);

CREATE INDEX "reviews_provider_idx" ON "reviews" ("provider_id", "created_at" DESC);

CREATE TABLE "favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "favorites_user_provider_unique" UNIQUE ("user_id", "provider_id")
);

CREATE INDEX "favorites_user_idx" ON "favorites" ("user_id", "created_at" DESC);
