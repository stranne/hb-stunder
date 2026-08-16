# HB Stunder

Unofficial frontend foundation for browsing and booking Hagabadet classes. HB Stunder is not affiliated with Hagabadet.

See [`docs/PROJECT_FOUNDATION.md`](docs/PROJECT_FOUNDATION.md) for product and architecture decisions.

## Requirements

- Node.js `^20.19.0`, `^22.18.0`, or `>=24.11.0`

## Commands

```sh
pnpm dev
pnpm check
pnpm test
pnpm build
pnpm storybook
pnpm build-storybook
pnpm api:generate
```

Vite+ owns development, checking, testing, and production builds. Dependency versions related to Vite+ and Storybook are pinned because Vite+ is still young.

GitHub Actions runs checking, unit tests, Storybook interaction and accessibility tests, and both production builds. It also uploads a short-lived GitHub Pages-compatible preview artifact; deployment remains disabled until the project is ready to publish.

## API generation

The reviewed OpenAPI snapshot is stored at [`openapi/openapi.yaml`](openapi/openapi.yaml). Regenerate the typed contract and fetch operations with the single command:

```sh
pnpm api:generate
```

Generated files are written to `src/api/generated/` and must not be edited manually. The generated `openapi-fetch` client has only a small base-URL configuration in `src/api/client.ts`; feature query and mutation behavior will be added manually when a vertical slice is approved.

The schema is an unofficial reverse-engineered draft. Public schedule operations are documented as unauthenticated, while customer operations use bearer JWT authentication. Rate limits, booking idempotency, and booking-conflict response bodies remain unconfirmed.

API timestamps such as `2026-07-28T06:00:00.000Z` must be interpreted as UTC and presented in `Europe/Stockholm` (`08:00` on that date). Date-domain utilities will be introduced with the first relevant feature rather than speculatively.

## Authentication and mocking

`pnpm dev` uses the real API. Sign in with your Hagabadet username and password; authenticated requests include the returned bearer token. By default the token and customer identity are kept for the browser session. The optional **Keep me signed in** choice persists them on that device only until the JWT expires; expired sessions are removed automatically. The password is never stored. Sign-out clears all stored session data and the customer booking cache.

The complete ordinary group-activity happy path—sign in, create a booking, list it under **My bookings**, cancel it, and observe its removal—has been manually verified against the real API on localhost. Waiting-list mutations, failure-specific responses, token renewal, idempotency/rate limits, and API usage permission remain unverified. A sanitized CORS probe from the planned GitHub Pages origin is recorded in [`docs/BOOKING_READINESS.md`](docs/BOOKING_READINESS.md); an authenticated end-to-end run from the deployed application is still required.

MSW is configured beneath the generated HTTP client. It is disabled by default and can only start in development:

```sh
VITE_ENABLE_MSW=true pnpm dev
```

With MSW enabled, the sign-in form starts the persisted mock customer session without sending its values to the API. Open **My bookings** to view the complete mocked customer booking response independently of schedule filters.

Storybook initializes MSW so stories can add handlers independently.

## Storybook organization

The sidebar is organized by what you are looking for rather than by source-file location:

- **Application / Pages** — every complete screen in one place. Each page groups its routed **In application** stories and isolated **States** such as loading, empty, and error views. Start here to browse Classes, Rooms, and My bookings. Navigation links inside the routed stories are functional.
- **Application / Shell** — app-wide navigation, menus, and other chrome that frames the pages.
- **Features** — feature-owned components, grouped by Authentication and Schedule.
- **Design system** — shared foundations and reusable components that are not owned by one product feature.

Every story title must start with one of these three top-level groups: **Application**, **Features**, or **Design system**. Choose the title by the story's responsibility, not its `src` directory; in particular, `src/app` is not a Storybook category.
