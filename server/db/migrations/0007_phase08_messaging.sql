CREATE TYPE "conversation_kind" AS ENUM ('INQUIRY', 'BOOKING');

CREATE TABLE "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" "conversation_kind" NOT NULL,
  "booking_id" uuid REFERENCES "bookings"("id") ON DELETE SET NULL,
  "provider_id" uuid REFERENCES "providers"("id") ON DELETE SET NULL,
  "pair_key" varchar(80),
  "last_message_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "conversations_booking_id_unique" UNIQUE ("booking_id"),
  CONSTRAINT "conversations_pair_key_unique" UNIQUE ("pair_key")
);

CREATE INDEX "conversations_last_message_idx" ON "conversations" ("last_message_at" DESC);

CREATE TABLE "conversation_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "last_read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "conversation_participants_unique" UNIQUE ("conversation_id", "user_id")
);

CREATE INDEX "conversation_participants_user_idx" ON "conversation_participants" ("user_id");

CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "body" text,
  "attachment_key" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "messages_conversation_idx" ON "messages" ("conversation_id", "created_at");

CREATE TYPE "notification_type" AS ENUM (
  'BOOKING_REQUEST',
  'BOOKING_ACCEPTED',
  'BOOKING_REJECTED',
  'BOOKING_CANCELLED',
  'PAYMENT_RESULT',
  'NEW_MESSAGE',
  'REVIEW_AVAILABLE'
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "notification_type" NOT NULL,
  "title" varchar(160) NOT NULL,
  "body" text NOT NULL,
  "href" varchar(255),
  "entity_type" varchar(40),
  "entity_id" uuid,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "notifications_user_idx" ON "notifications" ("user_id", "created_at" DESC);
CREATE INDEX "notifications_unread_idx" ON "notifications" ("user_id") WHERE "read_at" IS NULL;
