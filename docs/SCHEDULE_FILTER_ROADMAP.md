# Schedule filter redesign roadmap

## Status

Temporary implementation roadmap for the next product focus. Keep this file tracked while the work spans multiple sessions so decisions and progress are shared with the code. Update the checkboxes and decision notes as work lands, then delete this file in the final cleanup change once every retained decision is represented by the implementation, tests, stories, or permanent documentation.

Confirmed prototype: `Features/Schedule/Prototypes/Search-first filters` in Storybook establishes normal page scrolling, a removable active-selection summary with category icons and active business locations, favorites-first empty searches, explicit **Browse options**, alphabetical grouping, bounded **Show more** chunks, and checked selections that remain in browse and search results. The prototype is directional rather than a pixel-precise specification; preserve its information architecture while refining the production design.

The first saved-search implementation is now considered an intermediate implementation, not the target interaction. Replace its permanently visible naming input and implicit active/modified state with the grouped-selection design in section 3. Do not polish the current interaction in place if that makes the underlying state model harder to remove.

## Outcome

Make schedule filtering fast and understandable for both occasional and regular users:

- Keep the existing business-unit selection, which already works well.
- Replace the fragile virtualized lists and nested scrolling with a search-first, normally scrolling experience.
- Make selected filters visible and easy to remove.
- Let users save the current combination from the selected-filter summary, using a naming dialog only when requested.
- Represent an applied saved search as a visible, expandable named group in the selected-filter summary; no hidden “active” state.
- Keep saved-search definitions flat. Eventually consider combining multiple named groups without allowing saved searches to contain other saved searches.
- Keep favorites as shortcuts for constructing filters, not as a competing filter mode.

## Filtering semantics

A saved search is a flat snapshot containing selections in up to three categories: business units, activity types, and instructors.

- Multiple values inside one category use **OR**.
- Different populated categories inside one saved search use **AND**.
- A category with no values does not restrict its saved search.
- A saved search stores criteria only; it cannot contain or reference another saved search.
- In the first grouped-selection release, only one saved group can be applied at a time and applying it replaces the ordinary current selection.

Example:

```text
MyFilter = Drottningtorget AND (Hot yoga OR Yin yoga) AND Maya
```

Dates and presentation modes such as class/room view remain outside saved searches unless later user feedback demonstrates a need to include them.

The applied group is the source of truth and is active only while its named group is visibly present in the selected-filter summary. A direct criteria change outside the group's explicit edit flow detaches the selection from the saved search: keep the resulting criteria, but immediately remove the saved name rather than retaining a misleading active/modified state. Choosing **Edit saved search** instead creates an explicit draft and offers **Update**, **Save as new**, and **Cancel**.

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
- [x] After saving, represent the result as a named group in the selected-filter summary and announce success without moving focus unpredictably.

#### Showing and applying saved searches

- [x] Do not render an empty **Saved searches** heading, panel, or placeholder when none exist. The summary's **Save current selection** action is sufficient discovery for the empty state.
- [x] Once at least one exists, show a compact saved-search picker/library near the selected-filter summary; keep management secondary to applying a search.
- [x] Applying a saved search replaces the ordinary current selection in this release and inserts one visibly named, expandable group such as **MyFilter** into the selected-filter summary.
- [x] The collapsed group shows its name and a concise criteria/count summary. Expanding it shows category-labelled criteria and actions to remove, edit, rename, duplicate, or delete it.
- [x] Removing the group clears its applied criteria. Deleting its stored definition requires confirmation and must clearly state what happens to the current selection.
- [x] Never track an applied saved search only through styling, a hidden ID, or wording elsewhere in the panel. If the named group is not visible, it is not active.

#### Editing without misleading provenance

- [x] A direct filter change outside explicit group editing detaches the applied group immediately: preserve the resulting current criteria, remove the saved name, and leave the stored definition unchanged.
- [x] **Edit saved search** starts a clearly labelled draft based on that group's definition; changes do not write to storage until **Update** is chosen.
- [x] Offer **Save as new** from the edit flow. **Cancel** restores the applied stored definition.
- [x] Do not use a persistent “active but modified” state. If an unsaved edit marker is needed inside the explicit edit flow, label it as an editing draft and keep the available resolution actions adjacent.
- [x] Retain readable invalid-reference and storage-failure handling, duplicate-name validation, explicit cleanup of unavailable IDs, and the existing local-only storage disclosure.
- [x] Add/update model, component, and Storybook coverage for create-dialog cancellation and validation, no-saved-search state, collapsed/expanded applied group, detachment on direct change, update, save-as-new, delete, unavailable criteria, and storage failure.

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
- [ ] Run formatting, linting, type checking, unit tests, and the relevant Storybook checks.
- [ ] Remove superseded CSS, translations, URL fields, preference fields, and dead components after migrations are complete.
- [ ] Move any enduring product rules into permanent documentation if they are not self-evident from code and tests.
- [ ] Delete `docs/SCHEDULE_FILTER_ROADMAP.md` in the final cleanup commit.

## Recommended session boundaries

1. Prototype and agree on the normally scrolling search/list design.
2. Replace virtualization and nested scrolling, including tests and stories.
3. Improve active-selection summary and schedule-return behavior.
4. Add the saved-search model, persistence, and matching tests.
5. Replace the intermediate saved-search UI with save-on-request and a visible expandable named group.
6. Review favorites and polish the single-group experience, including detachment and explicit editing.
7. Prototype and, only if still worthwhile, implement sibling-group OR behavior, temporary narrowing, or portability.
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
- Introduce one visibly applied saved group before considering multi-group OR combinations; avoid “active” state that is not represented in the selection summary.
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
- Keep the saved-search picker visually separate from the selected-filter summary so stored definitions are not mistaken for active criteria. Render no saved-search library or empty-state panel until at least one saved search exists.
- An applied saved search is a visible, expandable named group. Direct changes outside explicit editing detach it to an ordinary selection instead of leaving it “active but modified.”
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
