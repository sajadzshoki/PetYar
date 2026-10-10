# Testing

## Unit tests

No database. Run:

```bash
npm run test:unit
```

Covers money/pricing, booking transition rules, upload sniffing, Zod payloads (including rejecting `ADMIN` on register and ignoring client payment amounts), the unavailable payment gateway, rate limiting, and migration journal consistency (`0010_phase12_audit` included).

## Integration tests

These talk to **PostgreSQL** through the real services (`getDb()`). They never fake a PAID payment.

```bash
# dedicated database — do not point this at production
export TEST_DATABASE_URL=postgres://petyar:petyar@localhost:5432/petyar_test
export DATABASE_URL="$TEST_DATABASE_URL"
npm run db:migrate
npm run test:integration
```

`npm test` runs unit tests always. Integration cases **skip** (they do not fail) when neither `TEST_DATABASE_URL` nor `DATABASE_URL` is set.

Apply migrations `0000`–`0010` before the integration suite. The suite inserts disposable rows with unique emails; it does not truncate existing tables.

## Environment

| Variable | Tests |
| --- | --- |
| `DATABASE_URL` / `TEST_DATABASE_URL` | Integration only |
| `ZARINPAL_MERCHANT_ID` | Leave empty so the unavailable adapter is used |
| `NUXT_SESSION_PASSWORD` | Not required for service-level tests |

## External services

Zarinpal is not called in CI. MinIO is not required (`STORAGE_DRIVER=local`).
