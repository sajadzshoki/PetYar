# API

Envelope:

- Success: `{ status: "ok", data: ... }`
- Error: `{ status: "error", error: { code, message, details? } }` with matching HTTP status.

All mutating routes validate with Zod. IDs are UUIDs. Owner/provider IDs always come from the session, never from the client body.

## Public / session

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/health` | no |
| POST | `/api/auth/register` | no (rate limited) |
| POST | `/api/auth/login` | no (rate limited) |
| POST | `/api/auth/logout` | session |
| GET | `/api/auth/me` | session |
| GET | `/api/providers` | no (search) |
| GET | `/api/providers/:id` | optional session (favorites) |
| GET | `/api/service-categories` | no |
| GET | `/api/discovery/facets` | no |
| GET | `/api/media/**` | public provider images; others owner/admin/participant |

## Owner / any logged-in user

Profile, pets, bookings, payments, conversations, notifications, favorites, reports, reviews on completed bookings.

## Provider (`/api/provider/*`)

Requires an owned provider row (`requireOwned`) except `GET/POST /api/provider` for create.

## Admin (`/api/admin/*`)

`requireAdmin`: re-reads `users.role = ADMIN` and `status = ACTIVE` from the database. Session cookie role is not enough.
