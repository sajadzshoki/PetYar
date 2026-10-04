# PetYar (پت‌یار)

Iranian pet-services marketplace. **Phase 04** adds server-side provider/service discovery (search, filters, sort, pagination). Bookings, payments, chat, reviews, and admin are intentionally not implemented.

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

Pets and provider marketplace listings are implemented. Future tables (availability, bookings, payments, reviews, messages, notifications, favorites, reports, disputes, verification) are still out of scope.

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
- Public: `GET /api/providers/:id`, pages `/providers` and `/providers/:id`. No fake ratings. Availability is a placeholder only.

## Search (phase 04)

- `GET /api/providers` runs SQL search (never ships the full catalog to the client): `q`, `category`, `city`, `district`, `priceMin`/`priceMax`, `view=providers|services`, `sort`, `page`/`pageSize`, optional `lat`/`lng`/`radiusKm`.
- Location uses Haversine on stored numeric coordinates and the provider service radius. PostGIS can replace that fragment later.
- Query string on `/providers` is the source of truth. Facets: `GET /api/discovery/facets`.

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
