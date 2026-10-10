# Booking lifecycle

Statuses: `PENDING` → `ACCEPTED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`.

Also: `REJECTED`, `CANCELLED`, `DISPUTED`.

## Who may move

| Action | Actor | From |
| --- | --- | --- |
| Create | owner | — (availability + overlap lock) |
| Accept / reject | provider | PENDING |
| Confirm | owner or provider | ACCEPTED (priced bookings require PAID payment) |
| Start | provider | CONFIRMED (same payment rule) |
| Complete | provider | IN_PROGRESS |
| Cancel | owner | PENDING, or ACCEPTED/CONFIRMED before start |
| Cancel | provider | ACCEPTED, CONFIRMED, IN_PROGRESS |
| Dispute | owner or provider | ACCEPTED, CONFIRMED, IN_PROGRESS, COMPLETED |

Creating a dispute writes a `disputes` row (previous status stored) and sets booking `DISPUTED`. Only one OPEN/IN_REVIEW dispute per booking.

Admin resolution may restore previous status, cancel, complete, or record a **refund recommendation** without moving money.

Price is computed with `quotePrice` on the server. Client totals are ignored.

Overlaps use a transaction + advisory lock. Active bookings occupy calendar slots.
