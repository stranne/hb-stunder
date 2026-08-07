# Schedule filter redesign roadmap

## Status

Temporary implementation roadmap for the next product focus. Keep this file tracked while the work spans multiple sessions so decisions and progress are shared with the code. Update the checkboxes and decision notes as work lands, then delete this file in the final cleanup change once every retained decision is represented by the implementation, tests, stories, or permanent documentation.

Confirmed prototype: `Features/Schedule/Prototypes/Search-first filters` in Storybook establishes normal page scrolling, a removable active-selection summary with category icons and active business locations, favorites-first empty searches, explicit **Browse options**, alphabetical grouping, bounded **Show more** chunks, and checked selections that remain in browse and search results. The prototype is directional rather than a pixel-precise specification; preserve its information architecture while refining the production design.

The first saved-search implementation and the later grouped-selection experiment are intermediate implementations, not the target interaction. Saved searches are now simple reusable presets: applying one replaces the ordinary filters, but its name or provenance is never inserted into **Selected filters**. The selected-filter summary shows only actual criteria and the action to save the current selection.

## Outcome

Make schedule filtering fast and understandable for both occasional and regular users:

- Keep the existing business-unit selection, which already works well.
- Replace the fragile virtualized lists and nested scrolling with a search-first, normally scrolling experience.
- Make selected filters visible and easy to remove.
- Let users save the current combination from the selected-filter summary, using a naming dialog only when requested.
- Keep the selected-filter summary limited to actual criteria; do not show a saved-search name or applied state there.
- Keep saved-search definitions flat reusable presets.
- Keep favorites as shortcuts for constructing filters, not as a competing filter mode.

## Filtering semantics

A saved search is a flat snapshot containing selections in up to three categories: business units, activity types, and instructors.

- Multiple values inside one category use **OR**.
- Different populated categories inside one saved search use **AND**.
- A category with no values does not restrict its saved search.
- A saved search stores criteria only; it cannot contain or reference another saved search.
- Applying a saved search replaces the ordinary current selection; the saved search itself does not remain active.

Example:

```text
MyFilter = Drottningtorget AND (Hot yoga OR Yin yoga) AND Maya
```

Dates and presentation modes such as class/room view remain outside saved searches unless later user feedback demonstrates a need to include them.

Applying a saved search copies its criteria into the ordinary selection; no active saved-search identity is retained. Choosing **Edit saved search** creates an explicit draft and a linear flow: rename first, edit locations/instructors/class types in a clearly highlighted criteria area, then use **Update**, **Save as new**, or **Cancel** after those controls.

If multiple groups are later validated, they should be sibling groups joined with **OR**, never nested groups. Any temporary narrowing would be shown separately and use:

```text
(saved search A OR saved search B) AND temporary refinements
```

Do not implement that expression until the relationship can be made visible and tested. Do not silently introduce ambiguous AND/OR behavior.

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

### 3. Replace the intermediate saved-search interaction

Use the product term **Saved searches** unless user testing identifies a clearer Swedish/English pair. Avoid exposing implementation terms such as templates, predicates, or Boolean groups.

The persisted model, matching rules, migration handling, validation, and management operations already exist and should be retained where compatible. The current always-visible name input and implicit active/modified behavior are superseded.

#### Saving from the current selection

- [x] Move **Save current selection** into the selected-filter summary as a compact icon action beside its other selection-level actions; keep the saved-search picker outside the summary.
- [x] Hide or disable that action when the selection has no meaningful restriction to save.
- [x] Open a focused dialog only after the user chooses to save; do not reserve permanent space for a naming input.
- [x] In the dialog, show a compact criteria preview, validate the name, and provide explicit **Save** and **Cancel** actions.
- [x] After saving, keep the selected-filter summary unchanged apart from its actual criteria and announce success without moving focus unpredictably.

#### Showing and applying saved searches

- [x] Do not render an empty **Saved searches** heading, panel, or placeholder when none exist. The summary's **Save current selection** action is sufficient discovery for the empty state.
- [x] Once at least one exists, show a compact saved-search list near the selected-filter summary. Use the same row-based visual language as the other search sections, make each row reliably apply its search, and keep management behind a secondary row action.
- [x] Applying a saved search replaces the ordinary current selection without inserting its name or any saved-search indication into the selected-filter summary.
- [x] Do not retain a hidden active saved-search identity. Once applied, criteria behave exactly like ordinary filters.
- [x] Keep saved-search editing in one clearly labelled, linear flow: name first, criteria second, and update/save-as-new/cancel actions last. Deleting a stored definition requires confirmation and keeps the current criteria selected.

#### Editing without misleading provenance

- [x] Ordinary filter changes never affect stored definitions.
- [x] The pencil action on a saved-search row starts a clearly labelled draft based on that definition; changes do not write to storage until **Update** is chosen.
- [x] Visually group the normal location, instructor, and class-type controls as the saved-search draft, then place its criteria preview, **Update**, **Save as new**, and **Cancel** actions after those fields. **Cancel** restores the stored definition.
- [x] Do not use a persistent active or modified state.
- [x] Retain readable invalid-reference and storage-failure handling, duplicate-name validation, explicit cleanup of unavailable IDs, and the existing local-only storage disclosure.
- [x] Add/update model, component, and Storybook coverage for create-dialog cancellation and validation, no-saved-search state, applying as ordinary filters, combined name/criteria editing, update, save-as-new, delete, unavailable criteria, and storage failure.

### 4. Integrate favorites without adding another mode

- [x] Keep favorite instructors and activity types as shortcuts shown while creating or editing a filter.
- [x] Ensure favoriting an option never activates it as a filter.
- [x] Allow favorites to be added or removed without causing list jumps or focus loss.
- [x] Evaluate whether “recently used” adds enough value after saved searches exist; do not add it by default.
- [x] Reassess the prominence of favorites after saved searches are usable, since saved searches may satisfy most repeat workflows.

### 5. Evaluate combining and portability only after the redesign

Do this only after one visible saved group is stable and understandable. Neither multi-group composition nor import/export belongs in the saved-search redesign milestone.

- [ ] Test whether users actually need multiple applied groups rather than quickly switching between saved searches.
- [ ] If needed, prototype multiple sibling named groups in the selected-filter summary and show the **OR** relationship explicitly.
- [ ] Never allow a saved search to include another saved search. One level of sibling groups is the maximum hierarchy; this prevents cycles, broken transitive references, confusing updates, and hard-to-explain URLs.
- [ ] Fetch the union of required business-unit schedules, deduplicate activities, and apply each complete saved-search predicate independently.
- [ ] Add unit tests proving that criteria from separate groups cannot incorrectly cross-match. For example, Maya at Haga must not match merely because one group contains Maya and another contains Haga.
- [ ] Decide whether manual selections replace named groups or appear in a separately labelled **Narrow results** area.
- [ ] If temporary narrowing is adopted, test `(group A OR group B) AND refinement` for every category.
- [ ] Keep a simple one-search path obvious; advanced combinations must not turn the default interface into a visual query builder.
- [ ] Decide how named groups and temporary refinements are represented in shareable URL state without creating excessively long or unstable URLs.
- [ ] Revisit export only when there is evidence that browser-local backup or transfer is needed. Prefer a versioned, human-readable file containing flat definitions.
- [ ] Consider import only together with schema validation, duplicate-name handling, limits, malformed/unknown-version errors, and an explicit preview before writing. Do not add import merely because export exists.

### 6. Validation and cleanup

- [ ] Update focused Storybook stories for desktop, mobile, long lists, search results, favorites, selections, saved-search management, and combined groups if implemented.
- [ ] Update component and model tests as each phase lands; remove virtualization-specific tests when virtualization is removed.
- [ ] Test with realistic option counts and slow devices before adding any new optimization.
- [ ] Confirm that schedule results are identical between class and room views for the same filter expression.
- [ ] Verify Swedish and English copy together.
- [x] Run formatting, linting, type checking, unit tests, and the relevant Storybook checks.
- [ ] Remove superseded CSS, translations, URL fields, preference fields, and dead components after migrations are complete.
- [ ] Move any enduring product rules into permanent documentation if they are not self-evident from code and tests.
- [ ] Delete `docs/SCHEDULE_FILTER_ROADMAP.md` in the final cleanup commit.

## Recommended session boundaries

1. Prototype and agree on the normally scrolling search/list design.
2. Replace virtualization and nested scrolling, including tests and stories.
3. Improve active-selection summary and schedule-return behavior.
4. Add the saved-search model, persistence, and matching tests.
5. Replace the intermediate saved-search UI with save-on-request and a separate preset library.
6. Review favorites and polish the preset editing experience.
7. Prototype advanced composition or portability only if later user evidence justifies it.
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
- Treat saved searches as presets copied into the ordinary selection; do not retain an active saved-search identity or put saved-search provenance in the selection summary.
- Keep dates and schedule view outside saved searches initially.
- Use **Show schedule** for the open filter toggle. Keep it in the existing sticky toolbar on mobile rather than adding a second full-width sticky action that would obscure filter content.
- Keep filter-view visibility in the URL. Opening and closing the editor create navigable history entries, while immediately applied refinements replace the current entry; Back/Forward restores both visibility and selections.
- The current activity-type API data has business-unit availability but no stable, user-meaningful category metadata, so group activity types alphabetically.
- Track this roadmap temporarily and delete it when the work is complete.
- Saved-search names are trimmed, unique regardless of case, limited to 60 characters, and capped at 20 local searches per browser.
- Keep unavailable saved-search references visible with their stored IDs once option loading succeeds, and offer an explicit cleanup action rather than silently changing the definition.
- Keep favorites prominent only inside the instructor and activity-type selectors as empty-search shortcuts. Saved searches remain the higher-level repeat-workflow feature; favorites do not get a separate mode or top-level section.
- Do not add recently used options. Saved searches and explicit favorites cover repeat workflows without introducing implicit history, additional storage semantics, or another ordering rule.
- Put **Save current selection** inside the selected-filter summary as a compact, accessibly named icon action and ask for a name in a dialog only after the action is invoked. Keep the similarly secondary **Clear filters** action compact and show it only when there is something to clear.
- Keep the row-based saved-search library visually separate from the selected-filter summary so stored definitions are not mistaken for active criteria. Render no saved-search library or empty-state panel until at least one saved search exists.
- A saved search is applied as ordinary criteria. Its pencil action starts a linear draft flow with the name, a highlighted criteria area using the normal filter controls, and save/cancel actions after the criteria.
- Saved-search definitions are flat snapshots. Do not permit saved searches within saved searches; any future composition is limited to one level of sibling groups.
- Defer import/export until the redesigned single-group workflow is validated and a concrete portability need exists.

## Open decisions

- [ ] Whether only one long browse section should be expanded at a time on small screens.
- [x] Whether activity-type API metadata provides stable, user-meaningful grouping. It currently does not; use alphabetical groups.
- [x] Exact navigation label and placement: use **Show schedule** in the existing sticky filter-toggle position.
- [x] Saved-search naming validation and maximum practical count: require a case-insensitively unique name of 1–60 trimmed characters and cap local storage at 20 searches.
- [ ] Whether saved searches eventually require account-backed synchronization.
- [ ] Whether combined sibling saved searches demonstrate enough real value to justify their added semantic and URL complexity.
- [ ] Whether users need export for browser-local backup or transfer before account synchronization exists; import remains dependent on a safe preview and conflict-resolution design.
