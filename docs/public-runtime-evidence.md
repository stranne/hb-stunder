# Public API runtime evidence

## Purpose

This document records sanitized, read-only verification of the live Hagabadet BRP Online API used by HB Stunder. It contains no credentials, bearer tokens, customer identifiers, or response payloads.

## Verification on 2026-08-18

Requests were sent directly to:

```text
https://hagabadet.brpsystems.com/brponline/api/ver3
```

No API key or customer credentials were supplied. Public GET requests included the planned GitHub Pages origin, `https://stranne.github.io`, to verify browser CORS behavior. The API reported `Brp-Version: 2026.110278`.

### Public reads

The following operations returned `200 OK`, JSON matching the high-level shapes recorded in `openapi/openapi.yaml`, and `Access-Control-Allow-Origin: *`:

- `GET /businessunits` — three business units with IDs `4128`, `1`, and `3509`.
- `GET /services/groupactivityinstructors` — an array of instructor resources.
- `GET /products/groupactivities?webCategory=2` — an array of group-activity products.
- `GET /businessunits/{businessUnit}/groupactivities` — schedule arrays for all three configured business units over a one-day interval.
- `GET /businessunits/{businessUnit}/groupactivities/{activityId}` — a scheduled group-activity object for an ID obtained from the public list.

The schedule responses included the fields consumed by the application, including activity ID, business unit, duration, product, instructors, locations, cancellation state, and slots.

### Authentication boundary

- An unauthenticated `GET /customers/0/bookings/groupactivities` returned `403`, confirming that customer booking reads are not public.
- `POST /auth/validate` without customer credentials returned `200` with a token-shaped bootstrap response. No returned token was retained or used as customer authorization. This does not establish the renewal semantics of an authenticated customer session.
- The ordinary authenticated sign-in, customer booking read/create/delete, and sign-out path was verified separately through an authorized localhost browser session as recorded in `docs/BOOKING_READINESS.md`.

### Planned-origin preflights

CORS preflights from `https://stranne.github.io` returned `200 OK` and `Access-Control-Allow-Origin: *` for:

- `POST /auth/login` with `Content-Type`.
- Customer booking `GET` with `Authorization`.
- Customer booking `POST` with `Authorization` and `Content-Type`.
- Customer booking `DELETE` with `Authorization`.

The responses allowed `GET,POST,PUT,DELETE` and echoed the requested headers. This verifies that the live API currently permits the browser transport needed by the planned static deployment. CORS configuration can still change independently of this application.

## Conclusion

The release-scope API integration is technically verified without an API key: public schedule and metadata reads are live, customer resources enforce authorization, the ordinary authenticated booking flow has already worked against the live API, and the planned origin passes the required CORS preflights. An additional deployed-origin run may be useful as a smoke test after deployment, but it is not treated as a separate implementation blocker.

Unknown edge contracts—authenticated token renewal, conflict-specific errors, rate limits, idempotency, and waiting-list cancellation—should be investigated only when implementing behavior that depends on them.
