# Deployment

## Requirements

- Node 22+
- PostgreSQL 16+
- Object storage: local disk or MinIO (`STORAGE_DRIVER`)

## Build

```bash
cp .env.example .env
# set NUXT_SESSION_PASSWORD (>= 32 chars) and DATABASE_URL
npm install
npm run db:migrate
npm run build
node .output/server/index.mjs
```

Listen on `0.0.0.0` behind TLS. Set `NUXT_PUBLIC_APP_URL` to the public origin (needed for payment callbacks).

Preview locally: `npm run preview` (already binds `0.0.0.0`).

## Docker

`docker compose up -d postgres` for a local database.

MinIO is under the `storage` compose profile.

## Tests before release

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Integration tests need `TEST_DATABASE_URL` and migrations through `0010_phase12_audit.sql`. See `docs/testing.md`.

## Do not

- Commit `.env`
- Run `db:seed` against production without reviewing `SEED_ADMIN_*`
- Enable a fake payment success path
