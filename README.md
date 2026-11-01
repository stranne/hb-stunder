# HB Stunder

Unofficial frontend foundation for browsing and booking Hagabadet classes. HB Stunder is not affiliated with Hagabadet.

See [`docs/PROJECT_FOUNDATION.md`](docs/PROJECT_FOUNDATION.md) for product and architecture decisions.

## Requirements

- Node.js `^22.22.2`, `^24.15.0`, or `>=26.0.0`. CI uses Node.js 26.

## Commands

```sh
pnpm dev
pnpm check
pnpm test
pnpm run test:production
pnpm build
pnpm storybook
pnpm build-storybook
pnpm api:generate
```

Vite+ owns development, checking, testing, and production builds. Dependency versions related to Vite+ and Storybook are pinned because Vite+ is still young.

`pnpm run test:production` builds the app, checks that the output contains only what production uses, and checks chunk sizes, on-demand view loading, navigation, filter persistence, and booking flows in Chromium using local API fixtures. Content Security Policy violations fail it. It includes a throttled mobile run and saves screenshots under `node_modules/.cache/code-splitting`. Install the browser with `pnpm exec playwright install chromium` if needed.

GitHub Actions runs checking, unit tests, Storybook interaction and accessibility tests, and both production builds. A separate job builds the site that gets deployed. It runs after the tests and without their cache, so test tools cannot touch it. Merging to `main` deploys the application to GitHub Pages, and the [deployment history](https://github.com/stranne/hb-stunder/deployments/github-pages) records the commit behind each release.

## Security

- **Content Security Policy:** GitHub Pages cannot send headers, so [`scripts/content-security-policy.ts`](scripts/content-security-policy.ts) adds the policy to the production page and calculates the inline script's hash. Add a host there if the app needs to contact a new one. Development and Storybook do not use the policy.
- **Production output:** [`scripts/check-production-output.mjs`](scripts/check-production-output.mjs) fails the build if the policy is missing or development content ships.
- **Action versions:** [`.github/workflows/actions.lock`](.github/workflows/actions.lock) pins every action, including indirect ones, to a commit. After changing a `uses:` line, run `gh actions-lock` (install it with `gh extension install github/gh-actions-lock`) and review the diff.
- **CI network access:** [`.github/egress-firewall.yaml`](.github/egress-firewall.yaml) limits which hosts the `verify` and `build` jobs can reach, using GitHub's egress firewall, which is in technical preview. When a host is denied, the run summary names it and the command that tried. Allow it only if the job really needs it.
- **Branch rules:** `main` accepts no force-pushes or deletion, and changes reach it through a pull request once the `verify` and `build` checks pass.

## API generation

The reviewed OpenAPI snapshot is stored at [`openapi/openapi.yaml`](openapi/openapi.yaml). Regenerate the typed contract and fetch operations with the single command:

```sh
pnpm api:generate
```

Generated files are written to `src/api/generated/` and must not be edited manually. The generated `openapi-fetch` client has only a small base-URL configuration in `src/api/client.ts`; feature query and mutation behavior will be added manually when a vertical slice is approved.

The schema is an unofficial reverse-engineered draft. Public schedule operations are documented as unauthenticated, while customer operations use bearer JWT authentication. Rate limits, booking idempotency, and booking-conflict response bodies remain unconfirmed.

API timestamps such as `2026-07-28T06:00:00.000Z` must be interpreted as UTC and presented in `Europe/Stockholm` (`08:00` on that date). Date-domain utilities will be introduced with the first relevant feature rather than speculatively.

## Authentication and mocking

`pnpm dev` uses the real API. Sign in with your Hagabadet username and password; authenticated requests include the returned bearer token. By default the token and customer identity are kept for the browser session, until the seven-day JWT expires. The optional **Keep me signed in** choice persists them on that device together with the refresh token, and the app renews the access token in the browser, so the session lasts until sign-out or until the server refuses the refresh token. The password is never stored. Sign-out clears all stored session data and the customer booking cache in every open tab, but no endpoint is known that revokes the refresh token on the server.

The complete ordinary group-activity happy path—sign in, create a booking, list it under **My bookings**, cancel it, and observe its removal—has been manually verified against the real API on localhost. Public reads and the planned GitHub Pages origin's required CORS preflights were reverified without an API key on 2026-08-18; sanitized evidence is recorded in [`docs/public-runtime-evidence.md`](docs/public-runtime-evidence.md). The release-scope API integration is therefore considered technically verified. Token renewal was verified with a real sign-in on 2026-11-01. Waiting-list mutations, failure-specific responses, and idempotency/rate limits remain unknown edge contracts rather than release blockers.

MSW is configured beneath the generated HTTP client. Its Vite plugin serves the worker in development, so the worker is not part of the repository or the production site. It is disabled by default and can only start in development:

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
