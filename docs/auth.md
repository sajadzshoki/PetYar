# Auth

- Cookie session via `nuxt-auth-utils` (sealed, httpOnly).
- Passwords: `hashPassword` / `verifyPassword`.
- Register cannot set `ADMIN`.
- Roles: `OWNER`, `PROVIDER`, `ADMIN`. Creating a provider profile promotes `OWNER` → `PROVIDER`.
- User status: `ACTIVE`, `SUSPENDED`, `DEACTIVATED`. Suspended/deactivated users cannot log in.
- `requireAuth` re-loads the user row and rejects non-`ACTIVE` accounts (clears the cookie).
- `requireAdmin` additionally requires `role = ADMIN`.
- Vue `middleware/auth` and `role` are UX only.

## Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Login/register are rate-limited per IP (in-process; use Redis if you run multiple Node processes).
