# Architecture

PetYar is a **modular monolith** (Nuxt 4 + Nitro + Vue + PostgreSQL). It is not a set of microservices.

```
app/        Pages, layouts, middleware, design tokens
server/     Nitro API handlers, services, db, storage, payments
shared/     Types, Zod schemas, constants, money/pricing helpers
```

## Request path

1. Browser renders a Vue page (`app/pages`).
2. Protected pages use `middleware/auth.ts` or `role` (session cookie).
3. Mutations call Nitro routes under `server/api`.
4. Handlers parse input with Zod (`shared/validation`), call a service, map errors with `handleApi`.
5. Services own domain rules and talk to PostgreSQL via Drizzle (`getDb()`).

## Rules

- Business logic does not live in Vue. Pages call APIs.
- Pages never import `server/db`.
- Object storage is an interface (`server/storage`) with `local` and `minio` drivers.
- Sessions are sealed httpOnly cookies (`nuxt-auth-utils`), not JWT.

## Module boundaries

| Layer | May import | Must not |
| --- | --- | --- |
| `app/` | `shared/`, APIs | SQL, hashing, storage adapters |
| `server/api` | services, utils, validation | Vue |
| `server/services` | db, storage, shared | Vue |
| `shared/` | nothing from app/server | Nitro, Vue, `fs` |

## Observability

JSON logs (`server/utils/logger.ts`). Health: `GET /api/health` (process + database ping). Current product phase is reported as `12`.
