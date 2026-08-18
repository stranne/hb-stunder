# Booking and authentication readiness

> **Current implementation:** `pnpm dev` submits credentials to `/auth/login`, derives the access token and customer identity from the response, persists them for the browser session by default or on the device after explicit opt-in, and uses bearer authentication for booking read/create/delete operations. Persisted sessions are accepted only while their JWT `exp` claim remains valid; passwords are never stored. Authorized manual verification has completed the ordinary group-activity happy path in one browser session: sign in, create a booking, observe it under **My bookings**, cancel it, and observe its removal. Public reads and the planned GitHub Pages origin's required CORS preflights were reverified without an API key on `2026-08-18`, as recorded in [`public-runtime-evidence.md`](public-runtime-evidence.md). Together, this evidence technically verifies the release-scope integration. It does not establish token-renewal, waiting-list mutation, or failure-specific contracts. MSW remains available when explicitly enabled.

## Scope and evidence

This began as a repository-only readiness assessment. Implementation was completed without credentials or live API traffic. A subsequent authorized manual check used real credentials locally to sign in and load the current customer's empty booking list; no credentials, tokens, or unsanitized response payloads are retained in this repository.

Evidence reviewed:

- `README.md` and `docs/PROJECT_FOUNDATION.md`
- `openapi/openapi.yaml` and generated `src/api/generated/schema.ts`
- `src/api/client.ts`, `src/api/config.ts`, and `src/api/errors.ts`
- Authorized manual verification of real sign-in and the complete ordinary booking create/list/cancel flow
- Sanitized `2026-08-18` live verification in [`public-runtime-evidence.md`](public-runtime-evidence.md): all release-scope public reads returned matching JSON shapes and `Access-Control-Allow-Origin: *`; planned-origin preflights allowed login and customer booking GET/POST/DELETE requests with the required headers
- The schedule query, model, tests, fixtures, and MSW handlers under `src/features/schedule/` and `src/mocks/`
- Git history through the implemented booking slices, especially `cd70438` (initial API foundation), `2a23850` (public schedule evidence), `ff6ba7b` (create-booking mock state), `7b934c5` (ordinary confirmation flow), and `cbd0c4b` (ordinary cancellation flow)

The OpenAPI file is explicitly an unofficial reverse-engineered draft. Its public runtime claims are now auditable in `docs/public-runtime-evidence.md`. Several medium-confidence annotations also cite `docs/har-evidence.md` and `docs/web-booking-evidence.md`, which are not present in this repository or its history; those provenance notes cannot currently be audited here.

No repository evidence proves the current schema incorrect, so it was not changed and generated types were not regenerated.

## Readiness findings

| Area                                      | Evidence-backed knowledge                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Unknowns / blockers                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication                            | The API-level default is bearer JWT. An authorized manual check confirmed that `POST /auth/login` returns enough information for the current decoder to derive an access token and customer identity, and that the token authorizes the customer booking read. The client injects the bearer token, stores it in session storage by default or local storage after explicit opt-in, enforces the JWT expiry locally, never stores the password, and clears both storage locations on sign-out. | The exact success schema remains undocumented. Expiry signals, renewal through `/auth/validate` or `/oauth/access_token`, refresh-token rotation, renewal concurrency, revocation, and standardized authentication errors remain unknown. A static client must not contain a client secret.                                                                         |
| Current customer's bookings               | Medium-confidence `GET /customers/{customerId}/bookings/groupactivities` returns `GroupActivityBooking[]`. The authenticated customer's ID is derived from the verified login response. Authorized happy-path testing confirmed that a newly created ordinary booking is decoded, listed under **My bookings**, linked through `groupActivity.id`, and exposes its cancellation ID through `groupActivityBooking.id`.                                                                          | Authorization against another customer ID, required versus optional fields, pagination/filtering, past bookings, waiting-list representation/position, and error responses remain unknown. The generated properties are optional, and two fields are deliberately `unknown`.                                                                                        |
| Book / join waiting list                  | Medium-confidence `POST /customers/{customerId}/bookings/groupactivities` has the observed JSON fields `groupActivity` and `allowWaitingList`; success was observed as `201` with no retained body. Authorized happy-path testing confirmed ordinary booking with `allowWaitingList: false` and subsequent GET reconciliation. No separate waiting-list operation is documented.                                                                                                               | Whether both request fields are required; exact semantics when a class becomes full; how waiting-list placement is reported; eligibility, booking-window, duplicate, payment/membership, and family-booking rules; and all failure bodies/statuses. Success must be reconciled by refetching bookings and schedule because no authoritative response body is known. |
| Cancel                                    | Medium-confidence `DELETE /customers/{customerId}/bookings/groupactivities/{bookingId}` succeeded without a body. Authorized happy-path testing confirmed that the current ordinary cancellation request with `bookingType=groupActivityBooking` succeeds and is reconciled by a subsequent GET.                                                                                                                                                                                               | Exact success status; whether the query is mandatory, especially for waiting-list cancellation; cancellation deadlines/fines; already-cancelled behavior; and failure bodies/statuses. There is also a low-confidence legacy delete operation whose semantics are unknown.                                                                                          |
| Conflicts / expired authentication        | The foundation requires these product states, and `ApiError` preserves an HTTP status and cause.                                                                                                                                                                                                                                                                                                                                                                                               | The schema defines no `400`, `401`, `403`, `409`, or `429` responses anywhere. There is no evidence-backed way to distinguish a booking conflict, expired session, authorization failure, or rate limit, nor to decide when a request is safe to retry.                                                                                                             |
| CORS, idempotency, and usage restrictions | Public schedule operations explicitly disable authentication. Authorized manual testing confirmed localhost browser CORS for login and the bearer-authenticated booking read/create/delete flow. Sanitized `2026-08-18` verification confirmed all release-scope public reads and successful planned-origin preflights for login and customer booking GET/POST/DELETE requests with the required headers. The release-scope transport is considered technically verified.                      | Mutation idempotency, retry policy, rate limits, and acceptable-use/automation policy remain undocumented. These are constraints on future retry or automation behavior, not blockers for the current deliberate, user-initiated flow. CORS can change independently of this application.                                                                           |

The schedule query still uses the public schedule operation and preserves visible data during refresh. When a customer is signed in, the UI also loads customer bookings, reconciles them to schedule activity IDs, and exposes the implemented booking, waiting-list, and ordinary-cancellation controls. The ordinary create/list/cancel chain is comprehensively exercised through MSW and has now also been manually verified against the real API.

## Operation trust assessment

### Suitable for current verified real use

- `GET /businessunits/{businessUnit}/groupactivities` (`curatedListBusinessUnitGroupActivities`): medium confidence, explicitly public, typed response, and already used by the schedule feature. Its interval must remain shorter than 14 days.
- `GET /customers/{customerId}/bookings/groupactivities` (`curatedListCustomerGroupActivityBookings`): authorized manual testing confirmed both empty and non-empty ordinary-booking paths with the current decoder.
- `POST /customers/{customerId}/bookings/groupactivities` (`curatedCreateCustomerGroupActivityBooking`): authorized manual testing confirmed the current ordinary booking request and GET reconciliation.
- `DELETE /customers/{customerId}/bookings/groupactivities/{bookingId}` (`curatedDeleteCustomerGroupActivityBooking`): authorized manual testing confirmed the current ordinary cancellation request and GET reconciliation.

These operations are functionally verified for the ordinary happy path on localhost, and the planned deployment origin passes their required CORS preflights. Their error semantics, idempotency, waiting-list behavior, and detailed cancellation rules remain unknown edge contracts.

### Not ready to use

- `POST /oauth/access_token`: low-confidence, unused by the current sign-in flow, and has an unknown response.
- `POST /auth/validate`: the operation's existence is medium-confidence, but its contract is too incomplete to implement renewal.
- `GET`/`DELETE /bookings/entries/customers/{id}` and family-booking operations: low-confidence and ambiguous.
- Employee, service-booking, and event-booking operations: outside this slice and/or insufficiently specified.

## MSW-first booking vertical slice

The booking UI was built first as a narrow, non-production slice around an explicit **mock customer sign-in**. The same replaceable session boundary now supports the manually verified real login and ordinary create/list/cancel path without coupling pages to the token format. MSW remains the default boundary for deterministic mutation tests.

### Implemented slices

#### Slice 1 — customer bookings read path

- Added customer-scoped booking query keys/options that call the generated `GET /customers/{customerId}/bookings/groupactivities` operation.
- Added schema-typed ordinary-booking fixtures and an MSW handler, including a booking for the current schedule and an upcoming booking.
- Made the mock customer identity available only when development MSW is explicitly enabled; without an explicit demo sign-in, the booking query is disabled and cannot contact the real API.
- Indexed bookings by `groupActivity.id`, reconciled them with schedule activity IDs, and added Swedish/English `already booked` card state.
- Added tests for query scoping and disabling, the exact generated request path through MSW, ID reconciliation, and the resulting card state. Tests use `onUnhandledRequest: "error"` so an unexpected live request fails the slice.

#### Slice 2 — create-booking MSW state

- Added generated-client mutation options that require an explicit `allowWaitingList` decision, send only the observed request fields, and disable automatic retries.
- Added a stateful development/test MSW `POST` handler that validates the exact mock request shape, updates customer booking state, and returns an empty `201`.
- Made mutation success invalidate and refetch the customer's group-activity bookings and all cached schedule lists. No optimistic booking state is written.
- Added tests for the exact customer path/body, refetching, state reconciliation through `GET`, generic `ApiError`, no retry, preserved cached data on failure, and unhandled-request isolation.

#### Slice 3 — ordinary book confirmation UI

- Added ordinary booking controls only for signed-in, ID-backed activities with available spots; waiting-list, full, cancelled, and already-booked cards do not expose this action.
- Added an accessible modal confirmation that always sends `allowWaitingList: false`, traps interaction while open, disables dismissal and controls while pending, and restores focus to the trigger or updated card when it closes.
- Kept the existing availability visible on failure, announced pending and generic error states, and changed the confirmation action to a deliberate retry after failure.
- Added component and MSW integration tests for confirmation, cancellation, focus restoration, duplicate-submit prevention, pending/error announcements, deliberate retry, the exact request body, refetch reconciliation, and waiting-list exclusion.

#### Slice 4 — explicit waiting-list flow

- Added a separate waiting-list action and confirmation only for signed-in, ID-backed activities whose schedule availability explicitly reports a waiting list.
- Clearly communicates that opting in does not book a class spot and sends `allowWaitingList: true` only after confirmation; ordinary booking continues to send `false`.
- Reconciles the stateful mock response through refetched bookings and distinguishes `On waiting list` from an ordinary booking without interpreting the unknown create response body.
- Preserves waiting-list availability after generic failures, prevents duplicate submission, announces pending/error states, offers deliberate retry, and restores focus using the shared confirmation behavior.
- Added English/Swedish copy, component and MSW integration coverage, and Storybook stories for ordinary and waiting-list confirmations plus joined, pending, and error states.

#### Slice 5 — ordinary cancellation

- Added a generated-client cancellation mutation that sends the reconciled booking ID with the observed `bookingType=groupActivityBooking`, disables retries, and invalidates customer bookings and schedule lists after success.
- Added a stateful development/test-only MSW `DELETE` handler that accepts only the mock customer and an existing ordinary booking, removes it, and returns an empty `204`.
- Offers cancellation only for ID-backed ordinary bookings, keeps waiting-list cancellation blocked, and requires confirmation before sending the request.
- Preserves the booking after generic failure, prevents duplicate submission, announces pending/error states, offers deliberate retry, and restores focus to the trigger or updated card.
- Added mutation, component, and MSW integration coverage plus Swedish/English copy and Storybook cancellation confirmation, pending, failure, and completed states.

#### Slice 6 — explicit mock sign-in and account-wide bookings

- Replaced automatic mock identity injection with an explicit, development/MSW-only sign-in session. The demo session survives refresh, supports sign-out, and cannot be activated when MSW is disabled.
- Added persistent top-level navigation and a dedicated `My bookings` route. It loads the complete customer group-activity booking response independently of date, location, instructor, and activity-type schedule filters.
- Shows ordinary and waiting-list status, Stockholm-local date/time, location, loading, empty, generic error, and deliberate retry states. The list sorts by the returned start time but does not invent an upcoming/past filter that the API contract does not document.
- Kept persisted credentials out of the frontend. The session provider contains bearer-token handling for the evidenced real-auth implementation; passwords are submitted only during sign-in and are never stored.
- Signing out clears customer booking data from the query cache. Added English/Swedish copy and integration coverage proving no customer request is made before explicit sign-in and that all returned bookings are listed.

#### Slice 7 — account cancellation and shared confirmation polish

- Extracted the proven async confirmation interaction so schedule booking, waiting-list, schedule cancellation, and account cancellation share pending, generic error, deliberate retry, duplicate-submit prevention, dismissal locking, and focus restoration behavior.
- Added cancellation to account-page rows only for ID-backed ordinary bookings. Waiting-list rows and bookings without an evidenced booking ID remain action-free.
- Reused the generated cancellation mutation and its bookings/schedule refetch behavior; a successful account cancellation removes the reconciled row and moves focus to the page heading when its trigger no longer exists.
- Added account-specific English/Swedish failure copy, responsive action layout, route-level MSW coverage for the exact delete request, failure/retry and waiting-list exclusion, and Storybook confirmation, error, and completed states.

### Remaining implementation slices

1. **Real integration (release scope verified):** real sign-in and the complete ordinary create/list/cancel chain work on localhost; release-scope public reads and planned-origin CORS preflights were reverified on `2026-08-18`. Idempotency/rate limits, conflict and expiry responses, renewal, waiting-list mutations, and detailed cancellation semantics remain unresolved edge contracts.

### Acceptance criteria

- The slice runs entirely through the generated client and MSW with no credentials or live mutation traffic.
- A customer must explicitly use the development/MSW demo sign-in before any customer request is made.
- A signed-in mock customer can load all returned group-activity bookings on a dedicated page, independently of schedule filters, and an existing booking is matched to its schedule activity by ID.
- An available class requires confirmation before the typed create request is sent.
- Waiting-list placement requires separate, explicit confirmation before `allowWaitingList` is sent.
- A successful create refetches bookings and schedule and then displays the server-mocked booked/waiting state.
- An ordinary booking can be cancelled after confirmation; success refetches bookings and schedule.
- Pending controls are disabled against duplicate submission; no automatic mutation retry or optimistic success occurs.
- A generic mutation failure preserves the prior UI state and offers a deliberate retry.
- Tests assert request paths and schema-backed request fields, query invalidation, duplicate-submit prevention, and no calls outside MSW.
- Swedish and English strings, keyboard operation, focus restoration, and an accessible pending/error announcement are covered without changing fonts, colors, or broader styling.
- Conflict-specific, expired-session renewal, and waiting-list cancellation tests remain explicitly pending until their wire contracts are evidenced.

## Remaining contract-dependent work

1. Obtain auditable, authorized documentation or sanitized evidence before implementing behavior for renewal responses, booking errors, waiting-list responses, or detailed cancellation query semantics. Login, customer-identity extraction, and the ordinary create/list/cancel happy path are already functionally verified.
2. Establish how expired authentication is distinguished and renewed without exposing secrets or replaying unsafe mutations.
3. Confirm booking-conflict and waiting-list outcomes, including stable status/body schemas.
4. Confirm rate limits and mutation idempotency/retry rules before adding automatic retries or automation.
5. Make required OpenAPI fields and error responses precise only after that evidence exists, then regenerate types.

## Recommended next task

The release-scope API integration is technically verified; **do not request public API, ordinary create/list/cancel, or planned-origin CORS verification again**. These are no longer release blockers. Continue product and design work. Investigate expired-session handling, conflict-specific errors, waiting-list cancellation, or retry behavior only when prioritizing those capabilities, and obtain authorized documentation or sanitized evidence before implementing behavior that depends on their wire contracts. Never retain credentials or access tokens in repository evidence.

Keep this document as the implementation checklist. Remove it only after the complete booking flow is implemented and the remaining contract-dependent work has either been resolved with auditable evidence or moved into permanent project documentation.
