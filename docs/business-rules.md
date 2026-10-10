# Business rules

- Pets and profile edits are always scoped to the session user.
- Providers only mutate their own profile, services, availability, and bookings.
- Search runs in SQL; the client never receives the full catalog.
- Public ratings exist only when real reviews exist. Hidden reviews are excluded.
- “احراز شده” appears only when `verification_status = APPROVED`. Pending/rejected is not shown publicly.
- Custom/negotiable services have no payable amount; they cannot be marked paid.
- Users cannot favorite themselves or report themselves.
- Admins cannot suspend themselves or other admins.
- Refunds never run unless the gateway is configured and the payment is actually PAID.
