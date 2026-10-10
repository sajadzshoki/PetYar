# Payments

- Currency: integer IRR. Never floats.
- Platform fee: `PAYMENT_PLATFORM_FEE_BPS` (default 1000 = 10%). Split on the server.
- One payment row per booking (`payments.booking_id` unique).
- Ledger: `payment_transactions` (CHARGE, PLATFORM_FEE, PROVIDER_PAYOUT, REFUND).

## Gateway

`server/payments`: Zarinpal when `ZARINPAL_MERCHANT_ID` is set; otherwise an **unavailable** adapter.

The unavailable adapter never marks PAID or REFUNDED.

## Owner flow

1. `POST /api/bookings/:id/pay` — amount from booking, not the client.
2. Redirect to gateway when configured.
3. Return URL `/payments/return` → `GET /api/payments/callback`.
4. Verify with gateway; only then PAID + ledger rows.

Priced bookings cannot be confirmed or started until payment is PAID.

Owner refunds: `POST /api/payments/:id/refund` after PAID, remaining amount only, real gateway refund.

Provider earnings pages sum **stored** payment columns. They do not invent charts or fee math in the UI.
