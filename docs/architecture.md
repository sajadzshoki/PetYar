# Phase 01 architecture notes

## Request path

1. Browser hits a Vue page (`app/pages`).
2. Protected pages use `middleware/auth.ts` (client + SSR session).
3. Mutations go to Nitro handlers in `server/api`.
4. Handlers parse the body with Zod, call a service, map errors through `handleApi`.
5. Services talk to PostgreSQL via Drizzle (`getDb()`).

## Auth

Sealed, httpOnly session cookie. Session payload is `{ user: SessionUser }`. Password hashes never leave the database.

Authorization:

- UI: middleware + `useUserSession()`.
- API: `requireAuth` / `requireRole` — never trust client-only checks.

## Storage

`getObjectStorage()` returns a local filesystem adapter. Switching `STORAGE_DRIVER=minio` is the intended production path; the MinIO adapter is intentionally not activated in phase 01.

## Observability

JSON logs via `server/utils/logger.ts`. Health: `GET /api/health` reports process + database ping.
