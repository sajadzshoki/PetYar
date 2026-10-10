# PetYar (پت‌یار)

Iranian pet-services marketplace. **Phase 10** is the provider workspace: bookings, calendar, services, profile, reviews, earnings from stored payments, transactions, honest verification status, and account settings. Admin, verification badges, and realtime sockets are intentionally not implemented.

## Architecture

Modular monolith (not microservices):

```
app/        Vue UI, pages, layouts, middleware, design tokens
server/     Nitro API, services, database, storage, authorization
shared/     Types, constants, Zod validation, small utilities
```

Rules:

- Keep business logic out of Vue components. Components call APIs; `server/services` owns domain rules.
- Database access lives in `server/db` + services — never in pages.
- Validation is shared Zod schemas (`shared/validation`) used on the server.
- Object storage is an interface (`server/storage`) with a local adapter and a MinIO-ready driver switch.
- PWA-ready: `public/manifest.webmanifest`, theme color, RTL, mobile-first layout.

Pets, providers, availability, bookings, payments, messaging, reviews, favorites, and the provider operations workspace are implemented. Admin, disputes, and document verification remain out of scope.

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
| `DATABASE_URL` | PostgreSQL connection string |
| `STORAGE_DRIVER` | `local` (default) or `minio` |
| `STORAGE_LOCAL_DIR` | Local object storage root |
| `MINIO_*` | MinIO credentials (unused until driver is minio) |
| `NUXT_PUBLIC_APP_*` | Public app name/url/locale |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` |

No secrets are hardcoded. Do not commit `.env`.

## Database

- ORM: Drizzle
- Config: `drizzle.config.ts`
- Schema: `server/db/schema`
- Migrations: `server/db/migrations`
- Seed: `server/db/seed.ts` (idempotent)

```bash
npm run db:generate   # after schema changes
npm run db:migrate
npm run db:studio
```

## Auth foundation

- Session cookies via `nuxt-auth-utils` (not JWT, not a mock login).
- Passwords hashed with the framework hasher (`hashPassword` / `verifyPassword`).
- Roles: `OWNER`, `PROVIDER`, `ADMIN`. Register cannot create `ADMIN`.
- Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Vue middleware: `auth`, `guest`, `role`.
- Server helpers: `requireAuth`, `requireRole`.
- `/account` is session-protected; `/api/auth/me` returns 401 without a session.

## Profiles and pets (phase 02)

- Profile: `GET/PATCH /api/profile`, `POST /api/profile/avatar`. Email is identity (not editable). Users can only change their own row.
- Pets: CRUD-style APIs under `/api/pets`. Owner ID always comes from the session.
- Soft archive (`DELETE`) keeps medical history; `POST .../restore` undoes it.
- Images go through the storage abstraction (`GET /api/media/**`). Pet/avatar files stay owner-only; provider photos/gallery are public.

## Providers (phase 03)

- Own profile: `GET/POST/PATCH /api/provider`, photo and gallery uploads. Creating a profile promotes `OWNER` → `PROVIDER`.
- Services: `/api/provider/services` with activate/deactivate and delete. Categories are seeded (sitting, walking, boarding, grooming, taxi, vet, training, home care).
- Public: `GET /api/providers/:id`, pages `/providers` and `/providers/:id`. No fake ratings.

## Search (phase 04)

- `GET /api/providers` runs SQL search (never ships the full catalog to the client): `q`, `category`, `city`, `district`, `priceMin`/`priceMax`, `view=providers|services`, `sort`, `page`/`pageSize`, optional `lat`/`lng`/`radiusKm`.
- Location uses Haversine on stored numeric coordinates and the provider service radius. PostGIS can replace that fragment later.
- Query string on `/providers` is the source of truth. Facets: `GET /api/discovery/facets`.

## Availability (phase 05)

- Weekly rules and date exceptions (BLOCK / OPEN) under `/api/provider/availability/*`. Overlapping active windows are rejected. Times are wall-clock **Asia/Tehran**.
- Calendar: `GET /api/provider/availability/calendar` and public `GET /api/providers/:id/calendar`.
- `GET /api/providers/:id/availability-check?start=&end=` decides if a range is free. Active bookings occupy calendar slots via `reservedIntervals`.
- UI: `/provider/availability`. Public profile shows the next week of slots.

## Bookings (phase 06)

- Owner: `POST /api/bookings`, `GET /api/bookings`, `GET /api/bookings/:id`, cancel / confirm / dispute. Quote: `GET /api/bookings/quote`.
- Provider: `GET /api/provider/bookings`, accept / reject / confirm / start / complete / cancel / dispute.
- Price is computed on the server (`quotePrice`). Client totals are ignored.
- Overlaps use a transaction + advisory lock. Pets must belong to the session owner; services to the provider.
- Pages: `/bookings`, `/bookings/new`, `/bookings/:id`, `/provider/bookings`.

## Payments (phase 07)

- Tables: `payments`, `payment_transactions`. Statuses: PENDING, PROCESSING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED.
- Amounts, platform fee (`PAYMENT_PLATFORM_FEE_BPS`), and provider payout are integer IRR, computed on the server.
- Gateway interface (`server/payments`): Zarinpal when `ZARINPAL_MERCHANT_ID` is set; otherwise an **unavailable** adapter. No fake PAID.
- Owner: `POST /api/bookings/:id/pay` (idempotent per booking), `GET /api/payments/:id`, refund, callback via `/payments/return`.
- Priced bookings cannot be confirmed/started until payment is PAID.
- Refunds only after verified PAID and a real gateway refund; unconfigured gateway never marks REFUNDED.

## Messaging and notifications (phase 08)

- Conversations (`INQUIRY` before booking, `BOOKING` after) with participants, messages, read state, and image attachments via object storage.
- Access is participant-only. `GET /api/conversations`, `POST /api/conversations`, thread + send + read + attachments.
- Persistent notifications for booking request/accept/reject/cancel, payment result, new message, and review-available (after complete). Read/unread APIs under `/api/notifications`.
- No WebSockets. Domain events persist; SSE can subscribe later without rewriting services.
- Pages: `/inbox`, `/inbox/:id`, `/notifications`.

## Reviews and trust (phase 09)

- One review per **completed** booking owned by the session user. Scores: overall, communication, quality, punctuality, care (1–5) plus a written comment. No edit/delete APIs.
- Aggregates (`AVG`) are computed on the server. Public profile and search show average and count only when reviews exist — never seeded or invented.
- Favorites: unique `(user, provider)`. Pages `/favorites`. No verification badges.

## Module boundaries

| Layer | May import | Must not |
| --- | --- | --- |
| `app/` | `shared/`, composables, APIs | `server/db`, hashing, SQL |
| `server/api` | services, utils, validation | Vue, UI components |
| `server/services` | db, storage, shared | HTTP/H3 response helpers except errors |
| `shared/` | nothing from app/server | Nitro, Vue, Node fs |

## Coding conventions

- TypeScript strict.
- Consistent API envelope: `{ status: 'ok', data }` or `{ status: 'error', error: { code, message, details } }`.
- Persian copy in the UI; English identifiers in code.
- Mobile-first, RTL (`lang=fa`, `dir=rtl`).
- Loading / error / empty via `AppState`.
- No duplicated business logic between client and server.

## Scripts

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```
