# Database

- Engine: PostgreSQL 16
- ORM: Drizzle
- Schema: `server/db/schema`
- Migrations: `server/db/migrations` (hand-written SQL, journal in `meta/_journal.json`)
- Seed: `server/db/seed.ts` (idempotent local ADMIN)

```bash
npm run db:migrate
npm run db:seed   # optional
```

## Core tables

| Table | Notes |
| --- | --- |
| `users` | email unique, role, status (`ACTIVE` / `SUSPENDED` / `DEACTIVATED`) |
| `pets` | owner FK restrict; soft archive |
| `providers` | one per user; `is_active`; verification columns |
| `provider_services` | category FK |
| `availability_rules` / `availability_exceptions` | wall-clock Asia/Tehran |
| `bookings` | status enum; `end_at > start_at` |
| `payments` | unique `booking_id`; unique `idempotency_key` |
| `payment_transactions` | ledger rows; unique idempotency |
| `conversations` | unique `booking_id`, unique `pair_key` |
| `conversation_participants` | unique `(conversation_id, user_id)` |
| `reviews` | unique `booking_id`; hidden columns |
| `favorites` | unique `(user_id, provider_id)` |
| `verification_applications` / `verification_documents` | provider documents |
| `reports` | target type + id (no FK — polymorphic) |
| `disputes` | booking FK; partial unique open/in-review per booking |
| `audit_logs` | actor, action, entity, metadata jsonb |

## Integrity notes

- Payments and bookings are `ON DELETE RESTRICT` so money history is not dropped.
- Open disputes: unique index `disputes_open_booking_idx` (migration `0010`).
- Review aggregates ignore `hidden_at IS NOT NULL`.
