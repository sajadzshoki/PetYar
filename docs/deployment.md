# Deployment

## Requirements

- Node 22+ (inside Docker on production; not required on the host)
- PostgreSQL 16+
- Object storage: local disk or MinIO (`STORAGE_DRIVER`)

## Local build (without Docker app)

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

## Local Docker (database only)

`docker compose up -d postgres` for a local database.

MinIO is under the `storage` compose profile.

The **repo** `docker-compose.yml` is for local Postgres/MinIO. Production uses a **different** compose file on the server (app + postgres). Do not overwrite the server compose with the repo file.

## Production server

| Item | Value |
|------|--------|
| Host | `188.121.107.118` |
| SSH | `root@188.121.107.118` port `22` |
| App path | `/root/projects/petyar/` |
| Public port | `3013` → container `3000` |
| Containers | `petyar-app` (`node:22`), `petyar-postgres` (`postgres:16`) |
| Start command | `docker-start.sh` → `npm install` → `db:migrate` → `build` → `node .output/server/index.mjs` |
| Health | `http://127.0.0.1:3013/api/health` |

Server-only files (never replace from the laptop repo):

- `.env`
- `docker-compose.yml` (production app + postgres + external `main` network)
- `docker-start.sh`

The deploy directory is **not** a git clone. Updates are file sync + container recreate.

### Manual update (you)

1. Commit/push locally if you want a backup on GitHub (optional for the server).
2. SSH in: `ssh root@188.121.107.118`
3. Sync new code into `/root/projects/petyar/` **without** overwriting `.env`, `docker-compose.yml`, or `docker-start.sh` (SCP/rsync/SFTP from your machine, or edit on the server).
4. Recreate the app container so install/migrate/build run again:

```bash
cd /root/projects/petyar
docker compose up -d --force-recreate --no-deps app
docker logs -f petyar-app
```

5. Confirm health:

```bash
curl -sS http://127.0.0.1:3013/api/health
# expect: status ok, database true
```

6. If the container exits: `docker logs petyar-app` and fix env/build errors; do not wipe Postgres volumes.

Useful checks:

```bash
docker ps --filter name=petyar
docker compose -f /root/projects/petyar/docker-compose.yml ps
```

### AI update (agent)

Give the agent SSH access (host, user, port, password or key) and ask to update production. The agent should:

1. Connect over SSH (e.g. Paramiko / OpenSSH).
2. Sync the local project tree to `/root/projects/petyar/`, **excluding**:
   - `.git`, `node_modules`, `.nuxt`, `.output`, `storage`, IDE folders
   - `.env`, `docker-compose.yml`, `docker-start.sh`
3. Run `docker compose up -d --force-recreate --no-deps app` in `/root/projects/petyar`.
4. Wait for logs (`Listening on http://0.0.0.0:3000`) and verify `/api/health`.
5. Report status; never commit or print `.env` / secrets.

Example sync exclusions for an agent script: skip dirs `.git`, `node_modules`, `.nuxt`, `.output`, `storage`; skip files `.env`, `docker-compose.yml`, `docker-start.sh`.

Prompt you can paste:

```text
Update PetYar on production: SSH root@188.121.107.118:/root/projects/petyar,
sync local code excluding .env/docker-compose.yml/docker-start.sh and build artifacts,
recreate petyar-app, confirm /api/health.
```

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
- Overwrite production `.env`, `docker-compose.yml`, or `docker-start.sh` with local/repo copies
- Run `db:seed` against production without reviewing `SEED_ADMIN_*`
- Enable a fake payment success path
- Delete Docker volumes `petyar_postgres_data` / `petyar_storage` unless you intend to wipe data
