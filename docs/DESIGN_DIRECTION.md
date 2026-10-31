# HB Stunder — Design Direction

## Status

This document records the current visual direction and the reasoning behind it. It is a working brief rather than a finished design specification. Decisions marked as open should be explored in Storybook and reviewed in the application before becoming permanent.

## Product character

The working direction is **contemporary bathhouse**: a combination of historic bathing culture, restrained Scandinavian design, and a precise modern booking interface.

The experience should feel:

- Warm, composed, restorative, and quietly distinctive.
- Practical enough for quickly scanning schedules and completing bookings.
- More architectural and editorial than a typical fitness application.
- Contemporary rather than nostalgic or imitation-luxury.

The application is unofficial and must have its own identity. Hagabadet is context and inspiration, not a design system to copy.

## Design principles

1. **Clarity before decoration.** Schedule density, status, time, and available actions must remain immediately understandable.
2. **Character through a few repeated choices.** Typography, line work, spacing, and selected architectural details should carry the identity; every component does not need an unusual shape.
3. **Accessible by default.** Preserve semantic controls, visible focus, sufficient contrast, generous targets, keyboard behavior, reduced motion, and text labels where icons alone may be ambiguous.
4. **Mobile first.** The primary experience must remain comfortable on a phone without making desktop views feel enlarged or sparse.
5. **Restrained physicality.** Warm surfaces, fine borders, and subtle depth are preferable to glossy spa imagery, heavy texture, or excessive shadows.
6. **State is never color-only.** Availability, selection, errors, and booking state must also be communicated through text, form, or iconography.

## Typography

### Adopted pairing

- **Newsreader Variable** for display and selected editorial typography.
- **Commissioner Variable** for body text, navigation, controls, dates, times, and status information.

Both fonts are self-hosted through Fontsource packages and support Swedish text. They were introduced in commit `65f0d2f`.

### Usage guidance

- Use Newsreader for page titles, class names, dialog titles, room names, day numbers, the wordmark, and occasional prominent phrases.
- Newsreader italic marks the date in page titles and the wordmark. It costs about 64 kB of font data, so keep it to those display uses.
- Keep Newsreader out of dense controls, long descriptions, and small status text.
- Use Commissioner throughout the functional interface.
- Prefer medium or semibold weights over uppercase for hierarchy.
- Use tabular numerals for schedules, capacity, dates, and times.
- Maintain comfortable line height for prose and avoid very light weights.
- Large Newsreader headings may use slightly tight tracking; small headings should not inherit aggressive display spacing.

## Iconography

### Adopted library

**Iconoir** is the utility icon family. It was selected for its refined, architectural line quality, React support, broad practical coverage, and MIT license.

It currently appears in navigation, account, date navigation, filter, favorite, checkbox, and close controls.

### Usage guidance

- Use one consistent stroke weight and optical size in each context.
- Prefer icons with visible text for navigation and unfamiliar actions.
- Icon-only controls require an accessible name and an adequate target size.
- Decorative icons must be hidden from assistive technology.
- Do not mix utility icon libraries.
- A small custom set of activity/category symbols could be explored later, but it should complement rather than replace Iconoir.

## Visual vocabulary

### The arch

The arch is the product's one signature shape. It appears in three places, each with a job:

- The selected day in the date strip stands on the strip's baseline as a filled arched window.
- Dialogs have a shallow arched top edge, and become bottom sheets on phones.
- Empty states show a line-drawn arched window in brass.

Do not add it elsewhere without a reason. Cards, buttons, and fields stay plain so that the arch keeps its meaning.

### Timetable rows, not cards

The class list and My bookings read as a printed timetable: a rail of times against ruled rows. Statuses, actions, and disclosure controls align in columns from row to row. Rows have no background or shadow of their own; state adds a tint where needed.

The room calendar follows the same logic: hairlines instead of drop shadows, full-hour lines with fainter half-hour lines, and flat tinted blocks.

### Brass as material accent

Brass marks the current navigation item, the booking count, external class messages, and empty-state artwork. Decorative brass does not meet text contrast requirements; use `--color-brass-strong` for text.

### Shape hierarchy

Pills are reserved for actions, filter chips, and compact statuses. Fields, dialogs, and calendar blocks use modest radii.

### Surface character

Warm paper, limestone, and glazed tile come from color, tonal variation, and line work. Avoid texture images, spa clichés, decorative gradients, and noise behind dense content.

## Interaction language

The adopted interaction direction is **quiet architectural states**: the same state uses the same cue, while different component roles may use different intensity.

- Controls remain physically stationary. Hover and press use tonal surfaces and keylines rather than vertical transforms.
- Hover uses a subtle accent wash and, where a boundary is visible, a stronger border. Press uses a slightly stronger version of the same treatment.
- Selected, current, and open controls use a persistent soft accent surface, accent foreground, and a structural cue such as a keyline, check, or marker. Full accent fills are primarily reserved for primary actions; the selected day's arch is the deliberate exception.
- Keyboard focus always uses the shared water-blue ring and remains visible on top of selected or semantic states. On the green band it uses `--color-focus-chrome`.
- The green band remaps the shared interaction tokens in `src/app/AppRoot.module.css`, because the recipes otherwise assume a light surface.
- Destructive oxblood is reserved for genuine cancellation and removal actions. It is an outlined control at rest, so that cancelling never outranks booking. It is not used as generic hover or focus feedback.
- Availability and booking colors describe semantic status, not interaction. Status remains understandable through text and markers rather than color alone.
- Past or otherwise muted schedule items retain their data-state treatment. If they remain interactive, hover and focus must still be visibly communicated; otherwise they must not show an interactive cursor.
- Directional or state-explanatory motion, such as a disclosure arrow rotating, is allowed. Decorative control movement is not.

The shared state colors live in `src/app/theme.css`; reusable control recipes live in `src/ui/interaction/Interaction.module.css`. New components should consume these tokens and recipes rather than defining page-specific hover, pressed, selected, focus, disabled, or destructive colors.

## Color

The adopted palette is **limestone and bathhouse green**, taken directly from the app icon (`docs/design/app-icon-source.png`). It was the leading study in the earlier color exploration and gives the interface the same identity as the icon on a phone's home screen.

| Role                    | Light                     | Dark                       | Source                 |
| ----------------------- | ------------------------- | -------------------------- | ---------------------- |
| Canvas                  | `#f5f0e6` limestone paper | `#0f1a16` dark glazed tile |                        |
| Band and primary action | `#0c3b30`, `#12503f`      | `#0a2a22`, `#a8d8bd`       | Icon background        |
| Ink                     | `#17261f`                 | `#f1ebdd`                  | Icon egg, in dark mode |
| Accent on the band      | `#e6b562`                 | `#e6b562`                  | Icon motion lines      |
| Focus                   | `#1f6fb2`                 | `#7fbdf0`                  | Icon water drop        |
| Destructive             | `#a3413f`                 | `#d9695f`                  |                        |

Dark mode is independently tuned rather than inverted: a green-black ground, warm cream type, and a pale celadon primary action.

All text pairs meet WCAG AA. Storybook's accessibility checks enforce this, including on the dark-mode stories. The Foundations stories show the tokens side by side.

## Layout

- Every view opens with a title in the same position. The schedule title is the selected date, which scrolls away so that only the date strip stays pinned.
- The class list, filters, and bookings share one reading width (`--page-width`). The room calendar takes up to 100rem, and runs edge to edge on phones.
- On phones, the wordmark and account menu scroll away at the top, while navigation stays under the thumb.

## Recommended next steps

- Evaluate the palette on real devices, particularly the green band against the phone's status bar.
- Consider a "now" divider in today's class list, so that past classes do not push the next class below the fold.
- Consider a sign-in action in the signed-out My bookings empty state.

## New-session handoff prompt

Use this prompt to continue the design work in a fresh session:

> Continue the HB Stunder visual design work. Read `docs/DESIGN_DIRECTION.md`, `docs/PROJECT_FOUNDATION.md`, and the current theme/components before proposing changes. The foundation is Newsreader + Commissioner with Iconoir. The concept is “contemporary bathhouse”: warm, architectural, Scandinavian, accessible, and highly functional rather than a generic fitness app or imitation luxury spa. The palette (limestone and bathhouse green, from the app icon), the timetable layout, and the arch as signature shape are adopted. Refine within that system, and discuss alternatives with me before changing direction site-wide.
