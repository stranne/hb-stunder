import { useMemo, useState } from "react";
import { Copy, EditPencil, FloppyDisk, Trash } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { Button as AriaButton } from "react-aria-components";
import { Button } from "../../../ui/button/Button";
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import {
  applySavedSearch,
  createSavedSearch,
  criteriaFromScheduleSearch,
  hasDuplicateSavedSearchName,
  SAVED_SEARCH_NAME_MAX_LENGTH,
  type SavedSearch,
  type SavedSearchCriteria,
} from "../model/savedSearch";
import {
  readSchedulePreferencesResult,
  SAVED_SEARCH_LIMIT,
  writeSavedSearches,
} from "../model/schedulePreferences";
import { SCHEDULE_LOCATIONS, type ScheduleSearch } from "../model/scheduleSearch";
import styles from "./SavedSearches.module.css";

interface SavedSearchesProps {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
  instructors: ScheduleFilterOption[];
  activityTypes: ScheduleFilterOption[];
  canValidateReferences: boolean;
  activeId?: string;
  onActiveChange?: (id: string | undefined) => void;
}

function sameIds(left: number[], right: number[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function sameCriteria(left: SavedSearchCriteria, right: SavedSearchCriteria) {
  return (
    sameIds(left.businessUnitIds, right.businessUnitIds) &&
    sameIds(left.instructorIds, right.instructorIds) &&
    sameIds(left.activityTypeIds, right.activityTypeIds)
  );
}

export function SavedSearches({
  search,
  onChange,
  instructors,
  activityTypes,
  canValidateReferences,
  activeId,
  onActiveChange,
}: SavedSearchesProps) {
  const { t } = useTranslation();
  const initial = useMemo(readSchedulePreferencesResult, []);
  const [savedSearches, setSavedSearches] = useState(initial.preferences.savedSearches);
  const [localActiveId, setLocalActiveId] = useState<string>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string>();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string>();
  const [editingName, setEditingName] = useState("");
  const [validationMessage, setValidationMessage] = useState<string>();
  const [storageIssue, setStorageIssue] = useState(initial.issue !== undefined);
  const currentCriteria = criteriaFromScheduleSearch(search);
  const currentActiveId = onActiveChange ? activeId : localActiveId;
  const instructorNames = new Map(instructors.map((option) => [option.id, option.name]));
  const activityTypeNames = new Map(activityTypes.map((option) => [option.id, option.name]));
  const locationNames = new Map<number, string>(
    SCHEDULE_LOCATIONS.map((option) => [option.id, option.name]),
  );

  function persist(next: SavedSearch[]) {
    const didWrite = writeSavedSearches(next);
    setStorageIssue(!didWrite);
    if (didWrite) setSavedSearches(next);
    return didWrite;
  }

  function setActive(id: string | undefined) {
    if (onActiveChange) onActiveChange(id);
    else setLocalActiveId(id);
  }

  function nameError(name: string, exceptId?: string) {
    const trimmed = name.trim();
    if (!trimmed) return t("schedule.savedSearches.nameRequired");
    if (trimmed.length > SAVED_SEARCH_NAME_MAX_LENGTH) {
      return t("schedule.savedSearches.nameTooLong", { count: SAVED_SEARCH_NAME_MAX_LENGTH });
    }
    if (hasDuplicateSavedSearchName(savedSearches, trimmed, exceptId)) {
      return t("schedule.savedSearches.duplicateName");
    }
    return undefined;
  }

  function addSavedSearch(name: string, source: ScheduleSearch) {
    if (savedSearches.length >= SAVED_SEARCH_LIMIT) {
      setValidationMessage(t("schedule.savedSearches.limit", { count: SAVED_SEARCH_LIMIT }));
      return;
    }
    const error = nameError(name);
    if (error) {
      setValidationMessage(error);
      return;
    }
    persist([...savedSearches, createSavedSearch(name, source)]);
    setNewName("");
    setValidationMessage(undefined);
  }

  function replaceSavedSearch(id: string, update: (savedSearch: SavedSearch) => SavedSearch) {
    persist(
      savedSearches.map((savedSearch) =>
        savedSearch.id === id ? update(savedSearch) : savedSearch,
      ),
    );
  }

  function duplicateSavedSearch(savedSearch: SavedSearch) {
    if (savedSearches.length >= SAVED_SEARCH_LIMIT) {
      setValidationMessage(t("schedule.savedSearches.limit", { count: SAVED_SEARCH_LIMIT }));
      return;
    }
    const baseName = t("schedule.savedSearches.copyName", { name: savedSearch.name });
    let copyName = baseName.slice(0, SAVED_SEARCH_NAME_MAX_LENGTH);
    let copyNumber = 2;
    while (hasDuplicateSavedSearchName(savedSearches, copyName)) {
      const suffix = ` ${copyNumber}`;
      copyName = `${baseName.slice(0, SAVED_SEARCH_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
      copyNumber += 1;
    }
    addSavedSearch(copyName, {
      ...search,
      locations: savedSearch.criteria.businessUnitIds,
      instructors: savedSearch.criteria.instructorIds,
      activityTypes: savedSearch.criteria.activityTypeIds,
    });
  }

  function labelsFor(
    ids: number[],
    names: Map<number, string>,
    unavailableLabel: (id: number) => string,
  ) {
    return ids.map((id) => names.get(id) ?? unavailableLabel(id)).join(", ");
  }

  function criteriaText(savedSearch: SavedSearch) {
    const parts = [
      savedSearch.criteria.businessUnitIds.length
        ? t("schedule.savedSearches.locationsCriteria", {
            values: labelsFor(savedSearch.criteria.businessUnitIds, locationNames, (id) =>
              t("schedule.savedSearches.unavailableLocation", { id }),
            ),
          })
        : undefined,
      savedSearch.criteria.instructorIds.length
        ? t("schedule.savedSearches.instructorsCriteria", {
            values: labelsFor(savedSearch.criteria.instructorIds, instructorNames, (id) =>
              t(
                canValidateReferences
                  ? "schedule.savedSearches.unavailableInstructor"
                  : "schedule.savedSearches.instructorId",
                { id },
              ),
            ),
          })
        : undefined,
      savedSearch.criteria.activityTypeIds.length
        ? t("schedule.savedSearches.activityTypesCriteria", {
            values: labelsFor(savedSearch.criteria.activityTypeIds, activityTypeNames, (id) =>
              t(
                canValidateReferences
                  ? "schedule.savedSearches.unavailableActivityType"
                  : "schedule.savedSearches.activityTypeId",
                { id },
              ),
            ),
          })
        : undefined,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : t("schedule.savedSearches.allClasses");
  }

  function unavailableIds(savedSearch: SavedSearch) {
    if (!canValidateReferences) return 0;
    return (
      savedSearch.criteria.businessUnitIds.filter((id) => !locationNames.has(id)).length +
      savedSearch.criteria.instructorIds.filter((id) => !instructorNames.has(id)).length +
      savedSearch.criteria.activityTypeIds.filter((id) => !activityTypeNames.has(id)).length
    );
  }

  function cleanUnavailable(savedSearch: SavedSearch) {
    replaceSavedSearch(savedSearch.id, (current) => ({
      ...current,
      criteria: {
        businessUnitIds: current.criteria.businessUnitIds.filter((id) => locationNames.has(id)),
        instructorIds: current.criteria.instructorIds.filter((id) => instructorNames.has(id)),
        activityTypeIds: current.criteria.activityTypeIds.filter((id) => activityTypeNames.has(id)),
      },
    }));
  }

  return (
    <section className={styles.savedSearches} aria-labelledby="saved-searches-heading">
      <div className={styles.heading}>
        <div>
          <h3 id="saved-searches-heading">{t("schedule.savedSearches.title")}</h3>
          <p>{t("schedule.savedSearches.localOnly")}</p>
        </div>
      </div>

      {storageIssue ? (
        <p className={styles.error} role="alert">
          {t("schedule.savedSearches.storageError")}
        </p>
      ) : null}

      <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          addSavedSearch(newName, search);
        }}
      >
        <label htmlFor="new-saved-search-name">{t("schedule.savedSearches.newName")}</label>
        <div className={styles.formRow}>
          <input
            id="new-saved-search-name"
            value={newName}
            maxLength={SAVED_SEARCH_NAME_MAX_LENGTH}
            onChange={(event) => {
              setNewName(event.target.value);
              setValidationMessage(undefined);
            }}
          />
          <Button type="submit">{t("schedule.savedSearches.saveCurrent")}</Button>
        </div>
        {validationMessage ? (
          <p className={styles.error} role="alert">
            {validationMessage}
          </p>
        ) : null}
      </form>

      {savedSearches.length === 0 ? (
        <p className={styles.empty}>{t("schedule.savedSearches.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {savedSearches.map((savedSearch) => {
            const isActive = currentActiveId === savedSearch.id;
            const isDirty = isActive && !sameCriteria(savedSearch.criteria, currentCriteria);
            const unavailableCount = unavailableIds(savedSearch);
            const criteriaCount =
              savedSearch.criteria.businessUnitIds.length +
              savedSearch.criteria.instructorIds.length +
              savedSearch.criteria.activityTypeIds.length;
            return (
              <li key={savedSearch.id} className={styles.card} data-active={isActive || undefined}>
                {editingId === savedSearch.id ? (
                  <form
                    className={styles.renameForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const error = nameError(editingName, savedSearch.id);
                      if (error) {
                        setValidationMessage(error);
                        return;
                      }
                      replaceSavedSearch(savedSearch.id, (current) => ({
                        ...current,
                        name: editingName.trim(),
                      }));
                      setEditingId(undefined);
                      setValidationMessage(undefined);
                    }}
                  >
                    <label htmlFor={`saved-search-${savedSearch.id}`}>
                      {t("schedule.savedSearches.rename")}
                    </label>
                    <div className={styles.formRow}>
                      <input
                        id={`saved-search-${savedSearch.id}`}
                        value={editingName}
                        maxLength={SAVED_SEARCH_NAME_MAX_LENGTH}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                      <Button type="submit">{t("schedule.savedSearches.saveName")}</Button>
                    </div>
                  </form>
                ) : (
                  <div className={styles.cardHeading}>
                    <strong>{savedSearch.name}</strong>
                    {isActive ? <span>{t("schedule.savedSearches.active")}</span> : null}
                  </div>
                )}
                <p>{criteriaText(savedSearch)}</p>
                {isDirty ? (
                  <p className={styles.notice}>{t("schedule.savedSearches.unsavedChanges")}</p>
                ) : null}
                {unavailableCount > 0 ? (
                  <p className={styles.notice}>
                    {t("schedule.savedSearches.unavailableReferences", { count: unavailableCount })}{" "}
                    <AriaButton
                      className={styles.inlineAction}
                      onPress={() => cleanUnavailable(savedSearch)}
                    >
                      {t("schedule.savedSearches.removeUnavailable")}
                    </AriaButton>
                    {unavailableCount === criteriaCount
                      ? ` ${t("schedule.savedSearches.cleanupMatchesAll")}`
                      : null}
                  </p>
                ) : null}
                <div className={styles.actions}>
                  <Button
                    tone="quiet"
                    onPress={() => {
                      setActive(savedSearch.id);
                      onChange(applySavedSearch(search, savedSearch));
                    }}
                  >
                    {t("schedule.savedSearches.activate")}
                  </Button>
                  {isActive ? (
                    <Button
                      tone="quiet"
                      onPress={() =>
                        replaceSavedSearch(savedSearch.id, (current) => ({
                          ...current,
                          criteria: currentCriteria,
                        }))
                      }
                    >
                      <FloppyDisk aria-hidden="true" />
                      {t("schedule.savedSearches.update")}
                    </Button>
                  ) : null}
                  <AriaButton
                    className={styles.iconAction}
                    aria-label={t("schedule.savedSearches.renameNamed", { name: savedSearch.name })}
                    onPress={() => {
                      setEditingId(savedSearch.id);
                      setEditingName(savedSearch.name);
                    }}
                  >
                    <EditPencil aria-hidden="true" />
                  </AriaButton>
                  <AriaButton
                    className={styles.iconAction}
                    aria-label={t("schedule.savedSearches.duplicateNamed", {
                      name: savedSearch.name,
                    })}
                    onPress={() => duplicateSavedSearch(savedSearch)}
                  >
                    <Copy aria-hidden="true" />
                  </AriaButton>
                  {confirmDeleteId === savedSearch.id ? (
                    <>
                      <Button
                        tone="quiet"
                        onPress={() => {
                          if (persist(savedSearches.filter(({ id }) => id !== savedSearch.id))) {
                            if (currentActiveId === savedSearch.id) setActive(undefined);
                            setConfirmDeleteId(undefined);
                          }
                        }}
                      >
                        {t("schedule.savedSearches.confirmDelete")}
                      </Button>
                      <AriaButton
                        className={styles.inlineAction}
                        onPress={() => setConfirmDeleteId(undefined)}
                      >
                        {t("schedule.savedSearches.cancelDelete")}
                      </AriaButton>
                    </>
                  ) : (
                    <AriaButton
                      className={styles.iconAction}
                      aria-label={t("schedule.savedSearches.deleteNamed", {
                        name: savedSearch.name,
                      })}
                      onPress={() => setConfirmDeleteId(savedSearch.id)}
                    >
                      <Trash aria-hidden="true" />
                    </AriaButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
