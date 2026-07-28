# HB Stunder — Project Foundation

## Purpose

HB Stunder is an unofficial frontend for browsing, filtering, and booking classes at a spa/gym.

The initial gym is Hagabadet. “HB Stunder” is a working name derived from “Hagabadet” and the Swedish word “stunder.”

This is intended to be:

- A useful application for personal use.
- A polished hobby and showcase project.
- A place to explore a modern “dream stack.”
- Enjoyable to develop, with LLM assistance allowed for configuration and repetitive integration work.
- Architecturally understandable without relying on generated application logic.

The product must have its own visual identity. It must not copy Hagabadet’s branding, logo, photography, or design system. A public version should clearly state that it is unofficial and not affiliated with Hagabadet. API terms and authorization must be confirmed before public release.

## Product priorities

1. Excellent mobile-first browsing and booking experience.
2. Distinctive, polished visual design.
3. Smooth but restrained interaction and animation.
4. Accessible controls and keyboard behavior.
5. Swedish and English localization.
6. A maintainable API and server-state architecture.
7. Storybook-driven component and design-system development.
8. Avoid unnecessary enterprise abstractions despite aiming for enterprise-quality results.

## Selected technology stack

- Vite+
- React
- Strict TypeScript
- TanStack Router
- TanStack Query
- Storybook using its React/Vite integration
- React Aria Components for accessible, headless behavior
- CSS Modules
- Modern CSS and CSS custom-property design tokens
- i18next
- react-i18next
- i18next-browser-languagedetector
- OpenAPI-generated TypeScript types and fetch client
- Prefer `openapi-typescript` and `openapi-fetch`, subject to inspecting the API schema
- MSW for development, Storybook, and tests
- Vitest through Vite+
- Motion may be added selectively when CSS animation is insufficient

Use pnpm through Vite+ unless the existing directory establishes another package manager.

Pin mutually compatible Vite+, Storybook, and addon versions because Vite+ is still young.

## Responsibility boundaries

```text
Vite+
  Development, building, formatting, linting, testing, and package workflow

React
  Rendering and interaction

TanStack Router
  Routes, navigation, and URL-based filter state

TanStack Query
  Server-state loading, caching, polling, invalidation, and mutations

Generated OpenAPI client
  Typed HTTP requests and API contracts

MSW
  Development and Storybook API simulation

React Aria Components
  Accessible headless interaction behavior

CSS Modules and design tokens
  The custom visual identity

Storybook
  Isolated component, state, responsive, and design-system development
```

Do not add Redux, Zustand, another HTTP client, or another server-state library initially.

## OpenAPI strategy

Generate:

- API path types
- Request types
- Response types
- Typed fetch operations

Do not generate TanStack Query hooks.

Write query options and mutations manually because these contain product decisions:

- Query keys
- Stale times
- Polling intervals
- Enabled conditions
- Cache invalidation
- Pagination
- Data selection
- Mutation behavior

Generated files must live in:

```text
src/api/generated/
```

Generated files must not be manually edited.

Provide a single documented API-generation command.

The generated client should be wrapped only by a small client configuration/error boundary. Avoid repository, service, and domain layers unless concrete complexity later justifies them.

Components should normally use feature query functions rather than call the generated client directly:

```text
Component
  → Feature query or mutation
    → Generated client
      → fetch
```

## TanStack Query strategy

TanStack Query has a query-oriented cache, not an automatically normalized entity cache.

Different searches are cached separately:

```text
['classes', 'list', { location: 'central' }]
['classes', 'list', { activity: 'yoga' }]
```

Use hierarchical query keys:

```text
['classes']
['classes', 'list']
['classes', 'list', filters]
['classes', 'detail', classId]
['bookings']
```

After a booking or cancellation:

- Patch visible cached data when the API returns an authoritative updated class and doing so is safe.
- Invalidate related class lists, class details, and user bookings.
- Let the server remain authoritative for filtered-list membership.
- Active queries may refetch immediately.
- Inactive queries can remain marked stale until revisited.

Do not introduce a normalized entity store initially.

## Refresh strategy

Keep polling intentionally simple at first:

```text
staleTime: approximately 20 seconds
refetchInterval: 60 seconds
refetchOnWindowFocus: true
refetchOnReconnect: true
```

Polling should normally occur only while a query is actively displayed.

Also refetch:

- Before final booking confirmation when current availability matters.
- After booking or cancellation.
- When returning to the application after it was inactive.

The gym may release uncollected tickets ten minutes before a class starts. Do not initially implement adaptive polling for this. A 30–60 second interval is likely sufficient for typical short sessions. Adaptive polling can be introduced later if actual use demonstrates a need.

## Background refresh experience

A background refresh must keep the current schedule visible. Do not replace existing content with a full loading state during polling.

Use stable class IDs as React keys.

When availability changes:

- Preserve the existing card and surrounding layout.
- Animate only the changed availability number or indicator.
- Avoid list reordering unless the selected sort explicitly requires it.
- Use tabular numerals and a stable number width to avoid layout shift.
- Do not animate the initial load as though live data changed.
- Respect prefers-reduced-motion.

Motion may be used for polished old-number/new-number transitions. Basic feedback should use CSS where practical.

## Localization

Support:

- Swedish (sv)
- English (en)

Language selection precedence:

1. A language explicitly selected and stored by the user
2. Browser language
3. Swedish fallback

The browser language should provide the initial default so the application works automatically.

Do not initially include locale segments in routes. Language-specific URLs can be reconsidered if SEO or shareable localized links become important.

Requirements:

- Avoid hard-coded user-facing strings.
- Use semantic translation keys.
- Update the document lang attribute when the locale changes.
- Format dates, times, numbers, and plurals through locale-aware APIs.
- Preserve proper nouns rather than translating them.
- Add a Storybook locale toolbar for Swedish and English.
- Use Storybook to catch text expansion and layout problems.

Gym class times must be interpreted explicitly in the gym’s timezone, expected to be Europe/Stockholm, subject to API confirmation.

## Visual and component strategy

The application should have a highly customized design inspired by design research, including sources such as Dribbble, but must prioritize real booking usability over appearance alone.

Do not use Mantine.

Use React Aria Components for accessible behavior while retaining ownership of styling.

Use:

- CSS Modules
- CSS custom properties
- Modern CSS nesting
- CSS layers where useful
- Container queries where useful
- Responsive design from the beginning

Do not add Sass, Tailwind, CSS-in-JS, or a styling compiler initially unless a concrete need appears.

Create a small internal UI system, not a general-purpose publishable component library.

Examples:

```text
Generic primitives:
- Button
- IconButton
- Dialog
- Input
- Select
- Badge
- Skeleton

Product components:
- GymClassCard
- AvailabilityBadge
- ScheduleFilters
- BookingConfirmation
- LocationPicker
```

Generic primitives can be reusable. Product components should remain product-aware rather than becoming excessively configurable.

Do not start with a monorepo or separate design-system package.

## Design tokens

Create foundational CSS tokens for:

- Colors
- Typography
- Spacing
- Radii
- Shadows
- Layering
- Motion durations
- Motion easing
- Focus indicators

Storybook should document these foundations.

Reduced-motion behavior is part of the design system and must be represented in Storybook.

## Storybook strategy

Storybook is a primary development environment, not documentation added at the end.

Stories should normally be colocated:

```text
GymClassCard.tsx
GymClassCard.module.css
GymClassCard.stories.tsx
```

Story categories should include:

### Foundations

- Colors
- Typography
- Spacing
- Radii
- Shadows
- Motion

### UI primitives

- Variants
- Interaction states
- Disabled states
- Focus states
- Responsive behavior

### Product states

- Available
- Almost full
- Fully booked
- Waiting list available
- Already booked
- Cancelled
- Loading
- Empty
- API error
- Availability changed

Storybook should support:

- Swedish and English
- Light and dark themes if both are implemented
- Mobile, tablet, and desktop viewports
- Reduced motion
- Accessibility checks
- Interaction tests where valuable

Use Storybook’s React/Vite integration.

Storybook may load the application Vite configuration. If the TanStack Router plugin or other application-only plugins interfere, conditionally enable them or adjust Storybook’s viteFinal configuration rather than duplicating all configuration.

## MSW strategy

MSW does not wrap or replace the generated API client. It intercepts network requests beneath it:

```text
Component
  → TanStack Query
    → Generated client
      → fetch
        → Real API or MSW
```

MSW must not run in production.

Use MSW for meaningful states that are difficult to reproduce against the real API:

- Empty schedule
- Fully booked class
- Waiting list
- Already booked
- Booking conflict
- Expired authentication
- Slow response
- Server error

MSW responses should use generated API types.

OpenAPI-generated mock handlers may provide a baseline, but meaningful product scenarios should generally be written manually.

Storybook should be able to apply MSW handlers per story for connected feature components.

Do not also create a separate fake API-client implementation.

## Animation

Use animation to explain state changes rather than decorate every action.

Use CSS for:

- Hover and pressed feedback
- Focus transitions
- Color transitions
- Small transforms
- Skeletons
- Availability highlights

Consider Motion for:

- Availability number transitions
- Dialog and sheet choreography
- Shared layout transitions
- Filter-panel transitions
- Booking confirmation sequences

Prefer animating opacity and transform. Avoid unnecessary layout animation and delays.

## Date and time concerns

Time is part of the product domain.

Confirm:

- API timestamp format
- API timezone behavior
- Whether timestamps are UTC
- Gym timezone
- Daylight-saving handling
- Whether date filters mean user-local or gym-local dates

Keep API timestamps as strings at the generated boundary. Parse and format them deliberately rather than globally converting every response property to Date.

## Suggested source structure

```text
src/
  app/
    providers/
    router.tsx
    theme.css

  api/
    generated/
    client.ts
    errors.ts

  i18n/
    index.ts
    locales/
      en.json
      sv.json

  ui/
    foundations/
    button/
    dialog/
    input/
    select/
    skeleton/

  features/
    auth/
    classes/
      api/
      components/
    schedule/
      api/
      components/
    bookings/
      api/
      components/
    locations/
    profile/

  routes/

  mocks/
    fixtures/
    handlers/
    scenarios/
    browser.ts

  test/
```

This is guidance, not a requirement to create empty directories prematurely.

## First vertical slice

Do not build the whole design system before proving the architecture.

The initial vertical slice should be:

```text
Schedule route
  → URL date/location filters
  → TanStack Query
  → Generated or temporary typed API client
  → MSW
  → GymClassCard
  → Availability animation
  → Swedish and English
  → Storybook
```

Initial GymClassCard stories should cover:

- Available
- Almost full
- Fully booked
- Waiting list
- Already booked
- Loading
- Error
- Availability changed
- Swedish
- English
- Mobile and desktop
- Reduced motion

This vertical slice should validate that Vite+, Storybook, TanStack Router, TanStack Query, localization, MSW, React Aria, and CSS Modules work together before the architecture expands.

## Implementation principles

- Prefer straightforward TypeScript over framework-like abstractions.
- Avoid speculative architecture.
- Keep routes thin.
- Keep API/query logic near the relevant feature.
- Keep server state in TanStack Query.
- Keep filters in router search parameters.
- Keep transient interaction state in React.
- Add global client-state tooling only after a demonstrated need.
- Use LLM assistance for setup and repetitive work, but keep important application behavior understandable.
- Add dependencies intentionally, even though this is deliberately a “dream stack.”

## Blocking API questions

Before implementing real API integration, establish:

1. Where the OpenAPI schema is located.
2. Whether it is complete and current.
3. How authentication works.
4. Whether OAuth Authorization Code with PKCE is supported if OAuth is used.
5. Whether bearer tokens or cookies are used.
6. Whether the API supports CORS from localhost and a future public origin.
7. Whether API usage is permitted for this project.
8. Whether the API has documented rate limits.
9. Whether booking mutations support idempotency.
10. What error responses booking conflicts use.

A static frontend cannot safely contain client secrets.

## Initial implementation sequence

1. Inspect the OpenAPI schema and authentication model.
2. Scaffold Vite+ with React and strict TypeScript.
3. Verify Vite+ development, checking, testing, and build commands.
4. Add TanStack Router and Query providers.
5. Add localization and browser-language detection.
6. Add Storybook with locale, viewport, and reduced-motion support.
7. Establish minimal design tokens and one React Aria primitive.
8. Configure OpenAPI generation.
9. Configure MSW.
10. Build the schedule/GymClassCard vertical slice.
11. Evaluate the combined development experience before adding more infrastructure.

## Deferred decisions

Do not decide these until there is evidence they are needed:

- Adaptive polling
- Normalized entity caching
- Global client-state library
- Monorepo
- Separate design-system package
- Generated TanStack Query hooks
- Complex form library
- Visual regression service
- PWA/offline support
- SSR
- Locale-prefixed routes
- General-purpose component API
