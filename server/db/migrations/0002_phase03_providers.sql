CREATE TYPE "pricing_type" AS ENUM ('HOURLY', 'DAILY', 'FIXED', 'PER_VISIT', 'CUSTOM');

CREATE TABLE "service_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL,
  "name" varchar(80) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  CONSTRAINT "service_categories_slug_unique" UNIQUE("slug")
);

INSERT INTO "service_categories" ("id", "slug", "name", "sort_order") VALUES
  ('11111111-1111-4111-8111-111111111111', 'pet-sitting', 'نگهداری در منزل', 1),
  ('11111111-1111-4111-8111-111111111112', 'dog-walking', 'پیاده‌روی سگ', 2),
  ('11111111-1111-4111-8111-111111111113', 'pet-boarding', 'پانسیون', 3),
  ('11111111-1111-4111-8111-111111111114', 'grooming', 'آرایش و بهداشت', 4),
  ('11111111-1111-4111-8111-111111111115', 'pet-taxi', 'پت تاکسی', 5),
  ('11111111-1111-4111-8111-111111111116', 'veterinary', 'دامپزشکی', 6),
  ('11111111-1111-4111-8111-111111111117', 'training', 'آموزش', 7),
  ('11111111-1111-4111-8111-111111111118', 'home-pet-care', 'مراقبت در خانه', 8);

CREATE TABLE "providers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "display_name" varchar(80) NOT NULL,
  "bio" text,
  "experience_years" integer,
  "experience" text,
  "photo_key" varchar(255),
  "service_area" varchar(300),
  "city" varchar(80),
  "district" varchar(80),
  "latitude" numeric(10, 7),
  "longitude" numeric(10, 7),
  "service_radius_km" numeric(6, 2),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "providers_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "provider_gallery" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
  "image_key" varchar(255) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "provider_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
  "category_id" uuid NOT NULL REFERENCES "service_categories"("id"),
  "title" varchar(120) NOT NULL,
  "description" text,
  "pricing_type" "pricing_type" NOT NULL,
  "price" numeric(12, 0),
  "duration_minutes" integer,
  "capacity" integer NOT NULL DEFAULT 1,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "providers_is_active_idx" ON "providers" ("is_active");
CREATE INDEX "provider_services_provider_id_idx" ON "provider_services" ("provider_id");
