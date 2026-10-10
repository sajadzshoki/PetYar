# PetYar (پت‌یار)

Iranian pet-services marketplace. Owners find providers, book care, pay, message, and review. Providers run a workspace. Admins handle verification, reports, disputes, and account safety.

Realtime sockets are intentionally not implemented.

## Architecture

Modular monolith (not microservices):

```
app/        Vue UI, pages, layouts, middleware, design tokens
server/     Nitro API, services, database, storage, authorization
shared/     Types, constants, Zod validation, money/pricing helpers
```

Rules:

- Keep business logic out of Vue. Components call APIs; `server/services` owns domain rules.
- Database access lives in `server/db` + services — never in pages.
- Validation is shared Zod schemas used on the server.
- Object storage is an interface (`local` or `minio`).
- PWA-ready: `public/manifest.webmanifest`, theme color, RTL, mobile-first.

See `docs/` for architecture, database, API, auth, business rules, booking lifecycle, payments, deployment, UI, and security.

## Local setup

Requirements: Node 22+, PostgreSQL 16+.

```bash
cp .env.example .env
# set NUXT_SESSION_PASSWORD (>= 32 chars) and DATABASE_URL

npm install
npm run db:migrate
npm run db:seed   # optional, creates local admin
npm run dev
```

Optional Docker for Postgres:

```bash
docker compose up -d postgres
```

## Environment variables

See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `NUXT_SESSION_PASSWORD` | Sealed session cookie secret (min 32 chars) |
| `DATABASE_URL` / `NUXT_DATABASE_URL` | PostgreSQL |
| `STORAGE_DRIVER` | `local` (default) or `minio` |
| `STORAGE_LOCAL_DIR` | Local object storage root |
| `MINIO_*` | MinIO credentials |
| `NUXT_PUBLIC_APP_*` | Public name / URL / locale |
| `ZARINPAL_MERCHANT_ID` | When empty, checkout stays unavailable |
| `ZARINPAL_SANDBOX` | `true` for sandbox |
| `PAYMENT_PLATFORM_FEE_BPS` | Default `1000` (10%) |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Local seed only |

No secrets are hardcoded. Do not commit `.env`.

## Database migration

```bash
npm run db:migrate
npm run db:studio   # optional
```

Migrations live in `server/db/migrations` (`0000`–`0010`). Apply them in order against PostgreSQL 16.

## Development

```bash
npm run dev          # binds 0.0.0.0
npm run typecheck
npm run lint
npm test             # unit + integration (integration skips without DATABASE_URL)
npm run test:unit
# TEST_DATABASE_URL=postgres://... npm run db:migrate && npm run test:integration
```

See `docs/testing.md`.

## Production build

```bash
npm run build
node .output/server/index.mjs
```

Or `npm run preview` (binds `0.0.0.0`).

## Deployment

Set `NUXT_PUBLIC_APP_URL` to the public HTTPS origin (payment callbacks). Run migrations before starting the Node server. Prefer MinIO or S3-compatible storage in production. See `docs/deployment.md`.

## Major business rules

- Session cookies, not JWT. Register cannot create `ADMIN`.
- Pets, bookings, and payments always use the session user — never client-supplied owner IDs.
- Booking price is computed on the server. Overlaps use a transaction + advisory lock.
- Unconfigured payment gateway never marks PAID or REFUNDED.
- Reviews: one per completed owner booking. Public averages only when reviews exist. Hidden reviews are excluded.
- Verification badge only after admin approval of real documents.
- Admin APIs re-check role and `ACTIVE` status in the database.
- Earnings are sums of stored payment rows, not invented analytics.

## Auth

- `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- Middleware: `auth`, `guest`, `role`
- Server: `requireAuth`, `requireRole`, `requireAdmin`
