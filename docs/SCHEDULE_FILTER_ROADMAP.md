# Schedule filter redesign roadmap

## Status

Temporary implementation roadmap for the next product focus. Keep this file tracked while the work spans multiple sessions so decisions and progress are shared with the code. Update the checkboxes and decision notes as work lands, then delete this file in the final cleanup change once every retained decision is represented by the implementation, tests, stories, or permanent documentation.

Confirmed prototype: `Features/Schedule/Prototypes/Search-first filters` in Storybook establishes normal page scrolling, a removable active-selection summary with category icons and active business locations, favorites-first empty searches, explicit **Browse options**, alphabetical grouping, bounded **Show more** chunks, and checked selections that remain in browse and search results. The prototype is directional rather than a pixel-precise specification; preserve its information architecture while refining the production design.

## Outcome

Make schedule filtering fast and understandable for both occasional and regular users:

- Keep the existing business-unit selection, which already works well.
- Replace the fragile virtualized lists and nested scrolling with a search-first, normally scrolling experience.
- Make selected filters visible and easy to remove.
- Let users save frequently used combinations as named saved searches.
- Eventually let users combine saved searches without forcing ordinary users to understand a query builder.
- Keep favorites as shortcuts for constructing filters, not as a competing filter mode.

## Filtering semantics

A saved search contains selections in up to three categories: business units, activity types, and instructors.

- Multiple values inside one category use **OR**.
- Different populated categories inside one saved search use **AND**.
- Multiple active saved searches use **OR**.
- A category with no values does not restrict its saved search.

Example:

```text
(Drottningtorget AND (Hot yoga OR Yin yoga) AND Maya)
OR
(Haga AND Spinning AND (Mikael OR Anna))
```

Dates and presentation modes such as class/room view remain outside saved searches unless later user feedback demonstrates a need to include them.

Temporary refinements should, by default, narrow the combined saved-search result:

```text
(saved search A OR saved search B) AND temporary refinements
```

This behavior must be made visible in the interface and tested before it is enabled. Do not silently introduce ambiguous AND/OR behavior.

## Delivery plan

### 1. Establish the simple filter experience

- [x] Confirm the filter information architecture in focused Storybook prototypes before replacing production behavior.
- [x] Preserve the current business-unit pill/checkbox selector with only necessary accessibility or responsive fixes.
- [x] Remove the custom list virtualizer, fixed row/group height assumptions, virtual spacers, and manual focus remapping from `ScheduleFilterPanel.tsx`.
- [x] Remove inner list and desktop page scrolling constraints; use normal document scrolling.
- [x] Replace the two-column constrained list layout with a responsive layout that remains comfortable on mobile and desktop.
- [x] Make instructors and activity types search-first selectors.
- [x] When search is empty, show favorites followed by an explicit way to browse all options; selection must not move or filter an option within any list.
- [x] Make all options discoverable without numbered pagination. Prefer grouped progressive disclosure such as **Show more** in bounded chunks.
- [x] Group instructors alphabetically.
- [x] Group activity types by trustworthy API category metadata if available; otherwise group alphabetically. Do not infer or merge distinct products by stripping durations from names without validating their identity and selection behavior.
- [x] Avoid duplicate rows within each selector. Keep selected options checked in their existing list position as well as represented by removable active-summary chips.
- [x] Show selected business locations (when fewer than all are active), instructors, and activity types near the top as removable chips with category icons.
- [x] Keep **Clear filters** adjacent to the active-filter summary.
- [x] Ensure loading, partial error, no-result, no-favorite, long-list, and selected-item states are represented.
- [x] Verify touch targets, visible focus, screen-reader labels, keyboard order, and browser find behavior.

### 2. Replace the modal-style completion behavior

- [x] Remove the bottom-right **Done** footer, because changes currently apply immediately and the filter is no longer a modal.
- [x] Make the sticky filter toggle clearly return to the schedule while the filter view is open, or provide a prominent **Show schedule** action near the active summary.
- [x] On mobile, evaluate a full-width sticky **Show schedule** action only if it does not recreate problematic nested or obscured scrolling.
- [x] Preserve selections when moving between the filter editor and schedule.
- [x] Confirm browser Back/Forward behavior and URL behavior for opening and closing filters.

### 3. Define and implement saved searches

Use the product term **Saved searches** unless user testing identifies a clearer Swedish/English pair. Avoid exposing implementation terms such as templates or Boolean groups.

- [ ] Define a versioned saved-search model with a stable ID, user-editable name, business-unit IDs, instructor IDs, and activity-type IDs.
- [ ] Keep runtime matching logic separate from storage and UI code.
- [ ] Add unit tests for empty categories, OR within categories, AND across categories, and one active saved search.
- [ ] Initially store saved searches locally alongside schedule preferences, with migration and malformed-data handling.
- [ ] Do not imply account synchronization while storage is local to one browser.
- [ ] Let users create a saved search from the current filter selection.
- [ ] Let users activate one saved search, replacing the current category selections in the first release.
- [ ] Let users rename, edit, duplicate, and delete saved searches.
- [ ] Prevent accidental overwriting: temporary changes to an activated saved search must not mutate its definition without an explicit save/update action.
- [ ] Display each saved search's criteria in readable text, not only its name.
- [ ] Provide useful empty, invalid-reference, duplicate-name, and storage-failure behavior.
- [ ] Decide how deleted or unavailable instructor/product IDs are presented and cleaned up.

### 4. Integrate favorites without adding another mode

- [ ] Keep favorite instructors and activity types as shortcuts shown while creating or editing a filter.
- [ ] Ensure favoriting an option never activates it as a filter.
- [ ] Allow favorites to be added or removed without causing list jumps or focus loss.
- [ ] Evaluate whether “recently used” adds enough value after saved searches exist; do not add it by default.
- [ ] Reassess the prominence of favorites after saved searches are usable, since saved searches may satisfy most repeat workflows.

### 5. Evaluate combining saved searches

Do this only after the single-active-search workflow is stable and understandable.

- [ ] Prototype selecting multiple saved-search cards/chips.
- [ ] Show the **OR** relationship explicitly in the active-search summary.
- [ ] Fetch the union of required business-unit schedules, deduplicate activities, and apply each complete saved-search predicate independently.
- [ ] Add unit tests proving that criteria from separate groups cannot incorrectly cross-match. For example, Maya at Haga must not match merely because one active group contains Maya and another contains Haga.
- [ ] Define whether manual selections replace active searches or appear in a separately labelled **Narrow results** area.
- [ ] If temporary narrowing is adopted, test `(group A OR group B) AND refinement` for every category.
- [ ] Keep a simple one-search path obvious; advanced combinations must not turn the default interface into a visual query builder.
- [ ] Decide how active groups and temporary refinements are represented in shareable URL state without creating excessively long or unstable URLs.

### 6. Validation and cleanup

- [ ] Update focused Storybook stories for desktop, mobile, long lists, search results, favorites, selections, saved-search management, and combined groups if implemented.
- [ ] Update component and model tests as each phase lands; remove virtualization-specific tests when virtualization is removed.
- [ ] Test with realistic option counts and slow devices before adding any new optimization.
- [ ] Confirm that schedule results are identical between class and room views for the same filter expression.
- [ ] Verify Swedish and English copy together.
- [ ] Run formatting, linting, type checking, unit tests, and the relevant Storybook checks.
- [ ] Remove superseded CSS, translations, URL fields, preference fields, and dead components after migrations are complete.
- [ ] Move any enduring product rules into permanent documentation if they are not self-evident from code and tests.
- [ ] Delete `docs/SCHEDULE_FILTER_ROADMAP.md` in the final cleanup commit.

## Recommended session boundaries

1. Prototype and agree on the normally scrolling search/list design.
2. Replace virtualization and nested scrolling, including tests and stories.
3. Improve active-selection summary and schedule-return behavior.
4. Add the saved-search model, persistence, and matching tests.
5. Add create/edit/activate/delete saved-search UI.
6. Review favorites and polish the single-search experience.
7. Prototype and, only if still worthwhile, implement multi-search OR behavior and temporary narrowing.
8. Complete accessibility, responsive, translation, and cleanup review; remove this roadmap.

Once implementation begins, work through one complete numbered roadmap section (or another explicitly agreed coherent milestone) per session rather than treating individual checkboxes as session-sized tasks. Each session should leave production behavior complete and tested rather than landing half-connected UI and model changes.

## Decision log

- Keep the business-unit selector as the established interaction.
- Show business units in the active summary only when fewer than all are selected, and identify every summary chip's category with an icon.
- Keep each removable chip fully clickable. Keep its remove icon neutral at rest, then use a soft danger hover/focus treatment for the whole chip to clarify the action without adding distracting color or presenting reversible filter changes as strongly destructive.
- Use Favorites + an explicit **Browse options** action when search is empty. Selection only changes checked state: it must never reorder or filter an option in favorites, browse, or search results.
- Treat the prototype as an information-architecture direction, not a pixel-precise production specification.
- Prefer search plus progressive browsing over numbered pagination.
- Prefer normal page scrolling over virtualized inner lists.
- Favorites are construction shortcuts; saved searches preserve combinations.
- Introduce one active saved search before multi-search OR combinations.
- Keep dates and schedule view outside saved searches initially.
- Use **Show schedule** for the open filter toggle. Keep it in the existing sticky toolbar on mobile rather than adding a second full-width sticky action that would obscure filter content.
- Keep filter-view visibility in the URL. Opening and closing the editor create navigable history entries, while immediately applied refinements replace the current entry; Back/Forward restores both visibility and selections.
- The current activity-type API data has business-unit availability but no stable, user-meaningful category metadata, so group activity types alphabetically.
- Track this roadmap temporarily and delete it when the work is complete.

## Open decisions

- [ ] Whether only one long browse section should be expanded at a time on small screens.
- [x] Whether activity-type API metadata provides stable, user-meaningful grouping. It currently does not; use alphabetical groups.
- [x] Exact navigation label and placement: use **Show schedule** in the existing sticky filter-toggle position.
- [ ] Saved-search naming validation and maximum practical count.
- [ ] Whether saved searches eventually require account-backed synchronization.
- [ ] Whether combined saved searches demonstrate enough real value to justify their added semantic and URL complexity.
