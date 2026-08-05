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

- Use Newsreader for page titles, class names, dialog titles, and occasional prominent phrases.
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

## Visual vocabulary to explore

### Architectural curves

Use shallow arches or softly curved upper edges as occasional signature details, potentially in page-title framing, dialog headers, or empty-state artwork. Do not make every card arch-shaped.

### Tile and grid structure

Treat the schedule grid as part of the identity. Fine separators, deliberate alignment, and subtle tiled rhythm could make the room calendar and date navigation recognizable without harming readability.

### Brass as material accent

Hagabadet uses a muted gold-like tone around `#AE9A64`. HB Stunder may reference muted brass, but it should be treated as a material or decorative accent rather than automatically becoming the main action color. Pale brass text on light surfaces is unlikely to meet contrast requirements; interactive use needs a sufficiently dark companion tone.

### Shape hierarchy

Reserve pills primarily for primary actions, compact statuses, and selected filters. Cards, fields, schedules, and dialogs can use more modest radii so that the interface does not become a collection of equally rounded floating objects.

### Surface character

Aim for warm paper, limestone, plaster, tile, or mineral associations through color, restrained tonal variation, and line work. Avoid obvious texture images, spa clichés, gradients used only for luxury signaling, and decorative noise behind dense content.

## Color status

Color has deliberately not been redesigned yet. The current warm canvas, dark ink, green accent, semantic states, and blue focus color remain in place.

A dedicated color exploration should:

- Define the emotional role of canvas, surfaces, ink, brass, and the primary action color.
- Keep decorative and interactive colors separate where their contrast requirements differ.
- Test normal, hover, pressed, selected, disabled, focus, warning, error, waiting-list, full, and cancelled states.
- Test contrast in both schedule cards and the denser room calendar.
- Decide whether a dark theme is valuable rather than assuming one is required.

## Layout status

Broader layout changes are also open. Likely areas to explore are:

- Reducing reliance on repeated floating cards.
- Strengthening the typographic hierarchy of times, dates, class names, and availability.
- Making the schedule and room grid the primary visual structure.
- Giving page-level content a clearer opening or identity without consuming scarce mobile space.
- Reviewing desktop width and density separately from mobile navigation.

## Recommended next step

Explore **color and surface direction** in Storybook before making broad layout changes. Create two or three bounded theme studies using the existing representative stories, then compare them for contrast, schedule legibility, visual character, and consistency. Do not immediately refactor every component around an untested concept.

After selecting a color/surface direction, review shape hierarchy and schedule layout together. This order reduces the risk of confusing a color improvement with a structural improvement.

## New-session handoff prompt

Use this prompt to continue the design work in a fresh session:

> Continue the HB Stunder visual design work. Read `docs/DESIGN_DIRECTION.md`, `docs/PROJECT_FOUNDATION.md`, and the current theme/components before proposing changes. The adopted foundation is Newsreader + Commissioner with Iconoir, introduced in commit `65f0d2f`. The working concept is “contemporary bathhouse”: warm, architectural, Scandinavian, accessible, and highly functional rather than a generic fitness app or imitation luxury spa. Colors and broader layout are intentionally still open. Start with a focused color and surface exploration in Storybook, including accessible interaction and schedule states. Discuss the proposed alternatives with me before applying a site-wide direction.
