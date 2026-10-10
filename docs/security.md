# Security

## AuthZ

- Never trust client owner/provider IDs.
- Admin APIs call `requireAdmin` (DB role + ACTIVE).
- Media: provider gallery/photos public; avatars/pets per user prefix; verification docs provider or admin; message attachments participant-checked.

## Uploads

`assertImageUpload` sniffs JPEG/PNG/WebP magic bytes and enforces a 2 MB cap. Client `Content-Type` is ignored.

## Sessions

Suspended users cannot log in. Existing sessions fail `requireAuth` and the cookie is cleared.

## Payments

Amounts, fees, and payouts are server-computed. Unconfigured gateway never PAID/REFUNDED.

## Rate limits

In-process per IP on login, register, report create, and pay. Not a substitute for edge WAF or Redis in multi-instance deploys.

## Sensitive data

National ID lives on verification applications and is returned to the owning provider and to admins only — not on public provider payloads (pending/rejected statuses are collapsed to `UNVERIFIED` for public views).

## Admin mutations

`adminService`, dispute resolve, report resolve, and verification review call `requireAdminActor` (DB `role=ADMIN` and `ACTIVE`), in addition to `requireAdmin` on HTTP handlers.

Payment callbacks reject a mismatched `authority` for an existing payment row. Message attachments are authorized only via conversation membership, not a global `messages/` prefix.

## Audit

Administrative and safety mutations write `audit_logs`.
