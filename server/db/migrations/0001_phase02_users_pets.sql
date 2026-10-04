ALTER TABLE "users" ADD COLUMN "first_name" varchar(60) NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "last_name" varchar(60) NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);
ALTER TABLE "users" ADD COLUMN "bio" text;
ALTER TABLE "users" ADD COLUMN "avatar_key" varchar(255);

UPDATE "users" SET "first_name" = "display_name" WHERE "first_name" = '';

CREATE TYPE "pet_type" AS ENUM ('DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'OTHER');
CREATE TYPE "pet_gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

CREATE TABLE "pets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(80) NOT NULL,
  "type" "pet_type" NOT NULL,
  "breed" varchar(80),
  "gender" "pet_gender" NOT NULL DEFAULT 'UNKNOWN',
  "birth_date" date,
  "weight_kg" numeric(6, 2),
  "photo_key" varchar(255),
  "behavior_notes" text,
  "allergies" text,
  "medical_notes" text,
  "neutered" boolean NOT NULL DEFAULT false,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "pets_owner_id_idx" ON "pets" ("owner_id");

CREATE TABLE "pet_vaccinations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pet_id" uuid NOT NULL REFERENCES "pets"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "administered_on" date NOT NULL,
  "next_due_on" date,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pet_medications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pet_id" uuid NOT NULL REFERENCES "pets"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "dosage" varchar(80),
  "frequency" varchar(80),
  "started_on" date,
  "ended_on" date,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pet_care_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pet_id" uuid NOT NULL REFERENCES "pets"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
