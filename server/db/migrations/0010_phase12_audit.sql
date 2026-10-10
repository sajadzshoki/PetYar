CREATE UNIQUE INDEX IF NOT EXISTS "disputes_open_booking_idx"
  ON "disputes" ("booking_id")
  WHERE "status" IN ('OPEN', 'IN_REVIEW');

CREATE INDEX IF NOT EXISTS "reports_target_idx" ON "reports" ("target_type", "target_id");
