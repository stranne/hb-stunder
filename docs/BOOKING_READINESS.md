# Booking and authentication readiness

## Scope and evidence

This is a repository-only readiness assessment. No credentials were used and no authentication, booking, cancellation, or other live API request was sent.

Evidence reviewed:

- `README.md` and `docs/PROJECT_FOUNDATION.md`
- `openapi/openapi.yaml` and generated `src/api/generated/schema.ts`
- `src/api/client.ts`, `src/api/config.ts`, and `src/api/errors.ts`
- The schedule query, model, tests, fixtures, and MSW handlers under `src/features/schedule/` and `src/mocks/`
- Git history through the implemented booking slices, especially `cd70438` (initial API foundation), `2a23850` (public schedule evidence), `ff6ba7b` (create-booking mock state), `7b934c5` (ordinary confirmation flow), and `cbd0c4b` (ordinary cancellation flow)

The OpenAPI file is explicitly an unofficial reverse-engineered draft. Several medium-confidence annotations cite `docs/har-evidence.md`, `docs/web-booking-evidence.md`, and `docs/public-runtime-evidence.md`, but those files are not present in this repository or its history. The annotations are useful provenance notes, but their underlying evidence cannot currently be audited here.

No repository evidence proves the current schema incorrect, so it was not changed and generated types were not regenerated.

## Readiness findings

| Area                                      | Evidence-backed knowledge                                                                                                                                                                                                                                                                                                                                                                                   | Unknowns / blockers                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication                            | The API-level default is bearer JWT. `POST /auth/login` and `POST /oauth/access_token` are public in the schema, but low-confidence and have unknown success bodies. `POST /auth/validate` inherits bearer authentication and is medium-confidence, but has no documented request body and an unknown success body. The client currently has no token injection, renewal, or authentication error handling. | Token and customer identity response shapes; token storage; expiry signal; whether renewal uses `/auth/validate`, `/oauth/access_token`, or both; refresh-token rotation; renewal concurrency; logout/revocation; cookie use; and OAuth Authorization Code with PKCE support. A static client must not contain a client secret.                                                             |
| Current customer's bookings               | Medium-confidence `GET /customers/{customerId}/bookings/groupactivities` returns `GroupActivityBooking[]`. The observed model links a scheduled activity through `groupActivity.id`, exposes a booking through `groupActivityBooking.id`, and includes duration, business unit, customer, and type.                                                                                                         | How the authenticated customer's ID is obtained and whether a caller may request another ID; required versus optional fields; pagination/filtering; past versus upcoming bookings; waiting-list representation/position; and error responses. The generated properties are optional, and two fields are deliberately `unknown`.                                                             |
| Book / join waiting list                  | Medium-confidence `POST /customers/{customerId}/bookings/groupactivities` has the observed JSON fields `groupActivity` and `allowWaitingList`; success was observed as `201` with no retained body. No separate waiting-list operation is documented.                                                                                                                                                       | Whether both request fields are required; exact semantics when a class becomes full; how ordinary booking versus waiting-list placement is reported; eligibility, booking-window, duplicate, payment/membership, and family-booking rules; and all failure bodies/statuses. Success must be reconciled by refetching bookings and schedule because no authoritative response body is known. |
| Cancel                                    | Medium-confidence `DELETE /customers/{customerId}/bookings/groupactivities/{bookingId}` succeeded without a body. The optional `bookingType` query parameter distinguishes booking categories, but only `groupActivityBooking` is shown as an example.                                                                                                                                                      | Exact success status; required values and whether the query is mandatory, especially for waiting-list cancellation; cancellation deadlines/fines; already-cancelled behavior; and failure bodies/statuses. There is also a low-confidence legacy delete operation whose semantics are unknown.                                                                                              |
| Conflicts / expired authentication        | The foundation requires these product states, and `ApiError` preserves an HTTP status and cause.                                                                                                                                                                                                                                                                                                            | The schema defines no `400`, `401`, `403`, `409`, or `429` responses anywhere. There is no evidence-backed way to distinguish a booking conflict, expired session, authorization failure, or rate limit, nor to decide when a request is safe to retry.                                                                                                                                     |
| CORS, idempotency, and usage restrictions | Public schedule operations explicitly disable authentication. README already records rate limits, booking idempotency, and conflict bodies as unconfirmed. The foundation says API terms and authorization must be confirmed before public release.                                                                                                                                                         | CORS support for localhost and a future origin, including authorization-header preflight; credentials policy; mutation idempotency key/header; retry policy; rate limits; acceptable-use/automation restrictions; and permission to ship this client are all unconfirmed. These are release blockers for real browser mutations.                                                            |

The existing schedule feature only calls the public schedule operation. Its MSW handler sits beneath the generated client, and the query already preserves visible data during refresh. Availability is schedule-derived; it does not yet reconcile the signed-in customer's bookings or expose mutation controls.

## Operation trust assessment

### Suitable for current real read-only use

- `GET /businessunits/{businessUnit}/groupactivities` (`curatedListBusinessUnitGroupActivities`): medium confidence, explicitly public, typed response, and already used by the schedule feature. Its interval must remain shorter than 14 days.

### Suitable only as the typed boundary for an MSW-first slice

- `GET /customers/{customerId}/bookings/groupactivities` (`curatedListCustomerGroupActivityBookings`)
- `POST /customers/{customerId}/bookings/groupactivities` (`curatedCreateCustomerGroupActivityBooking`)
- `DELETE /customers/{customerId}/bookings/groupactivities/{bookingId}` (`curatedDeleteCustomerGroupActivityBooking`)

Their path/method and basic success shapes are medium-confidence, but they are **not trustworthy enough for real mutation traffic** until authentication, identity binding, CORS, error semantics, idempotency, and usage permission are confirmed.

### Not ready to use

- `POST /auth/login` and `POST /oauth/access_token`: low-confidence with unknown responses.
- `POST /auth/validate`: the operation's existence is medium-confidence, but its contract is too incomplete to implement renewal.
- `GET`/`DELETE /bookings/entries/customers/{id}` and family-booking operations: low-confidence and ambiguous.
- Employee, service-booking, and event-booking operations: outside this slice and/or insufficiently specified.

## MSW-first booking vertical slice

Build one narrow, non-production slice around an explicit **mock customer sign-in**; do not add credential collection, token persistence, or real API authentication. Keep the session boundary replaceable so the UI can later consume an evidenced real identity without coupling pages to a token format.

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
- Kept credential collection and token handling out of the frontend. A replaceable session provider is the boundary for a future evidenced real-auth implementation.
- Signing out clears customer booking data from the query cache. Added English/Swedish copy and integration coverage proving no customer request is made before explicit sign-in and that all returned bookings are listed.

#### Slice 7 — account cancellation and shared confirmation polish

- Extracted the proven async confirmation interaction so schedule booking, waiting-list, schedule cancellation, and account cancellation share pending, generic error, deliberate retry, duplicate-submit prevention, dismissal locking, and focus restoration behavior.
- Added cancellation to account-page rows only for ID-backed ordinary bookings. Waiting-list rows and bookings without an evidenced booking ID remain action-free.
- Reused the generated cancellation mutation and its bookings/schedule refetch behavior; a successful account cancellation removes the reconciled row and moves focus to the page heading when its trigger no longer exists.
- Added account-specific English/Swedish failure copy, responsive action layout, route-level MSW coverage for the exact delete request, failure/retry and waiting-list exclusion, and Storybook confirmation, error, and completed states.

### Remaining implementation slices

1. **Real integration (blocked):** replace the mock session provider only after the authentication/customer-identity contract is evidenced. Then resolve CORS, API permission, idempotency/rate limits, conflict and expiry responses, and cancellation semantics before enabling any browser mutation against the real API.

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

## Blockers before real integration

1. Obtain auditable, authorized API documentation or sanitized evidence for login/renewal responses, customer identity, booking errors, and cancellation query semantics.
2. Confirm API usage permission, CORS for intended origins, rate limits, and mutation idempotency/retry rules.
3. Establish how expired authentication is distinguished and renewed without exposing secrets or replaying unsafe mutations.
4. Confirm booking-conflict and waiting-list outcomes, including stable status/body schemas.
5. Make required OpenAPI fields and error responses precise only after that evidence exists, then regenerate types.

## Recommended next task

Resolve the **real-integration evidence blockers** before adding another production-facing slice. Obtain authorized, auditable contracts for authentication and customer identity, CORS and API usage permission, mutation idempotency/rate limits, booking conflict and session-expiry errors, and cancellation semantics. Keep the current mock sign-in and every mutation development/test-only; do not add real credentials, conflict-specific behavior, expired-session behavior, or waiting-list cancellation until those contracts are evidenced.

Keep this document as the implementation checklist. Remove it only after the complete booking flow is implemented and the real-integration blockers above have either been resolved with auditable evidence or moved into permanent project documentation.
