import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, EditPencil, FloppyDisk, Trash } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { Button as AriaButton, Dialog, Heading, Input, Label, Modal } from "react-aria-components";
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
import { LOCATION_IDS, SCHEDULE_LOCATIONS, type ScheduleSearch } from "../model/scheduleSearch";
import styles from "./SavedSearches.module.css";

interface SavedSearchesProps {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
  instructors: ScheduleFilterOption[];
  activityTypes: ScheduleFilterOption[];
  canValidateReferences: boolean;
  saveActionContainer?: HTMLElement | null;
  libraryContainer?: HTMLElement | null;
}

type SaveDialogMode = "current" | "draft";

function hasMeaningfulCriteria(search: ScheduleSearch) {
  return (
    search.locations.length < LOCATION_IDS.length ||
    search.instructors.length > 0 ||
    search.activityTypes.length > 0
  );
}

export function SavedSearches({
  search,
  onChange,
  instructors,
  activityTypes,
  canValidateReferences,
  saveActionContainer,
  libraryContainer,
}: SavedSearchesProps) {
  const { t } = useTranslation();
  const nameId = useId();
  const initial = useMemo(readSchedulePreferencesResult, []);
  const [savedSearches, setSavedSearches] = useState(initial.preferences.savedSearches);
  const [editingId, setEditingId] = useState<string>();
  const [saveDialogMode, setSaveDialogMode] = useState<SaveDialogMode>();
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>();
  const [storageIssue, setStorageIssue] = useState(initial.issue !== undefined);
  const [announcement, setAnnouncement] = useState("");
  const editingSearch = savedSearches.find(({ id }) => id === editingId);
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

  function nameError(value: string, exceptId?: string) {
    const trimmed = value.trim();
    if (!trimmed) return t("schedule.savedSearches.nameRequired");
    if (trimmed.length > SAVED_SEARCH_NAME_MAX_LENGTH) {
      return t("schedule.savedSearches.nameTooLong", { count: SAVED_SEARCH_NAME_MAX_LENGTH });
    }
    if (hasDuplicateSavedSearchName(savedSearches, trimmed, exceptId)) {
      return t("schedule.savedSearches.duplicateName");
    }
    return undefined;
  }

  function labelsFor(
    ids: number[],
    names: Map<number, string>,
    unavailableLabel: (id: number) => string,
  ) {
    return ids.map((id) => names.get(id) ?? unavailableLabel(id)).join(", ");
  }

  function criteriaText(criteria: SavedSearchCriteria) {
    const parts = [
      criteria.businessUnitIds.length > 0 && criteria.businessUnitIds.length < LOCATION_IDS.length
        ? t("schedule.savedSearches.locationsCriteria", {
            values: labelsFor(criteria.businessUnitIds, locationNames, (id) =>
              t("schedule.savedSearches.unavailableLocation", { id }),
            ),
          })
        : undefined,
      criteria.instructorIds.length
        ? t("schedule.savedSearches.instructorsCriteria", {
            values: labelsFor(criteria.instructorIds, instructorNames, (id) =>
              t(
                canValidateReferences
                  ? "schedule.savedSearches.unavailableInstructor"
                  : "schedule.savedSearches.instructorId",
                { id },
              ),
            ),
          })
        : undefined,
      criteria.activityTypeIds.length
        ? t("schedule.savedSearches.activityTypesCriteria", {
            values: labelsFor(criteria.activityTypeIds, activityTypeNames, (id) =>
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

  function apply(savedSearch: SavedSearch) {
    setEditingId(undefined);
    setConfirmDelete(false);
    onChange(applySavedSearch(search, savedSearch));
    setAnnouncement(t("schedule.savedSearches.applied", { name: savedSearch.name }));
  }

  function startEditing(savedSearch: SavedSearch) {
    setEditingId(savedSearch.id);
    setEditName(savedSearch.name);
    setConfirmDelete(false);
    setValidationMessage(undefined);
    onChange(applySavedSearch(search, savedSearch));
  }

  function save() {
    const error = nameError(name);
    if (error) {
      setValidationMessage(error);
      return;
    }
    if (savedSearches.length >= SAVED_SEARCH_LIMIT) {
      setValidationMessage(t("schedule.savedSearches.limit", { count: SAVED_SEARCH_LIMIT }));
      return;
    }
    const savedSearch = createSavedSearch(name, search);
    if (!persist([...savedSearches, savedSearch])) return;
    setEditingId(undefined);
    setSaveDialogMode(undefined);
    setName("");
    setValidationMessage(undefined);
    setAnnouncement(t("schedule.savedSearches.saved", { name: savedSearch.name }));
  }

  function duplicate(savedSearch: SavedSearch) {
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
    if (
      persist([
        ...savedSearches,
        createSavedSearch(copyName, {
          ...search,
          locations: savedSearch.criteria.businessUnitIds,
          instructors: savedSearch.criteria.instructorIds,
          activityTypes: savedSearch.criteria.activityTypeIds,
        }),
      ])
    ) {
      setAnnouncement(t("schedule.savedSearches.saved", { name: copyName }));
    }
  }

  function update() {
    if (!editingSearch) return;
    const error = nameError(editName, editingSearch.id);
    if (error) {
      setValidationMessage(error);
      return;
    }
    const updated = {
      ...editingSearch,
      name: editName.trim(),
      criteria: criteriaFromScheduleSearch(search),
    };
    if (
      persist(
        savedSearches.map((savedSearch) => (savedSearch.id === updated.id ? updated : savedSearch)),
      )
    ) {
      setEditingId(undefined);
      setValidationMessage(undefined);
      setAnnouncement(t("schedule.savedSearches.updated", { name: updated.name }));
    }
  }

  function cancelDraft() {
    if (!editingSearch) return;
    onChange(applySavedSearch(search, editingSearch));
    setEditingId(undefined);
    setValidationMessage(undefined);
    setConfirmDelete(false);
  }

  function deleteSearch(savedSearch: SavedSearch) {
    if (persist(savedSearches.filter((item) => item.id !== savedSearch.id))) {
      setEditingId(undefined);
      setConfirmDelete(false);
      setValidationMessage(undefined);
    }
  }

  function cleanUnavailable(savedSearch: SavedSearch) {
    const cleaned = {
      ...savedSearch,
      criteria: {
        businessUnitIds: savedSearch.criteria.businessUnitIds.filter((id) => locationNames.has(id)),
        instructorIds: savedSearch.criteria.instructorIds.filter((id) => instructorNames.has(id)),
        activityTypeIds: savedSearch.criteria.activityTypeIds.filter((id) =>
          activityTypeNames.has(id),
        ),
      },
    };
    if (persist(savedSearches.map((item) => (item.id === savedSearch.id ? cleaned : item)))) {
      if (editingId === savedSearch.id) onChange(applySavedSearch(search, cleaned));
    }
  }

  const saveAction =
    hasMeaningfulCriteria(search) && !editingId ? (
      <AriaButton
        className={styles.iconAction}
        aria-label={t("schedule.savedSearches.saveCurrent")}
        onPress={() => {
          setName("");
          setValidationMessage(undefined);
          setSaveDialogMode("current");
        }}
      >
        <FloppyDisk aria-hidden="true" />
      </AriaButton>
    ) : null;

  const library =
    savedSearches.length > 0 ? (
      <section className={styles.library} aria-labelledby={`${nameId}-library-title`}>
        <div className={styles.libraryHeading}>
          <h3 id={`${nameId}-library-title`}>{t("schedule.savedSearches.title")}</h3>
          <p>{t("schedule.savedSearches.localOnly")}</p>
        </div>
        <div className={styles.searchList}>
          {savedSearches.map((savedSearch) => {
            const isEditing = editingId === savedSearch.id;
            return (
              <div className={styles.searchItem} key={savedSearch.id}>
                <div className={styles.searchRow}>
                  <AriaButton className={styles.applyAction} onPress={() => apply(savedSearch)}>
                    <span>{savedSearch.name}</span>
                    <small>{criteriaText(savedSearch.criteria)}</small>
                  </AriaButton>
                  <AriaButton
                    className={styles.iconAction}
                    aria-label={t("schedule.savedSearches.editNamed", { name: savedSearch.name })}
                    onPress={() => startEditing(savedSearch)}
                  >
                    <EditPencil aria-hidden="true" />
                  </AriaButton>
                </div>
                {isEditing ? (
                  <form
                    className={styles.editor}
                    onSubmit={(event) => {
                      event.preventDefault();
                      update();
                    }}
                  >
                    <div className={styles.editorHeading}>
                      <h4>{t("schedule.savedSearches.editTitle")}</h4>
                      <p>{t("schedule.savedSearches.editInstructions")}</p>
                    </div>
                    <Label htmlFor={`${nameId}-edit-${savedSearch.id}`}>
                      {t("schedule.savedSearches.editName")}
                    </Label>
                    <Input
                      id={`${nameId}-edit-${savedSearch.id}`}
                      value={editName}
                      maxLength={SAVED_SEARCH_NAME_MAX_LENGTH}
                      onChange={(event) => {
                        setEditName(event.target.value);
                        setValidationMessage(undefined);
                      }}
                    />
                    <p className={styles.criteriaPreview}>
                      {criteriaText(criteriaFromScheduleSearch(search))}
                    </p>
                    {validationMessage ? (
                      <p className={styles.error} role="alert">
                        {validationMessage}
                      </p>
                    ) : null}
                    <div className={styles.actions}>
                      <Button type="submit">
                        <FloppyDisk aria-hidden="true" />
                        {t("schedule.savedSearches.update")}
                      </Button>
                      <Button
                        tone="quiet"
                        onPress={() => {
                          setName("");
                          setValidationMessage(undefined);
                          setSaveDialogMode("draft");
                        }}
                      >
                        {t("schedule.savedSearches.saveAsNew")}
                      </Button>
                      <Button tone="quiet" onPress={cancelDraft}>
                        {t("schedule.savedSearches.cancel")}
                      </Button>
                    </div>
                    <div className={styles.secondaryActions}>
                      <AriaButton
                        className={styles.inlineAction}
                        onPress={() => duplicate(savedSearch)}
                      >
                        <Copy aria-hidden="true" />
                        {t("schedule.savedSearches.duplicate")}
                      </AriaButton>
                      <AriaButton
                        className={styles.inlineAction}
                        onPress={() => setConfirmDelete(true)}
                      >
                        <Trash aria-hidden="true" />
                        {t("schedule.savedSearches.remove")}
                      </AriaButton>
                    </div>
                    {unavailableIds(savedSearch) > 0 ? (
                      <p className={styles.notice}>
                        {t("schedule.savedSearches.unavailableReferences", {
                          count: unavailableIds(savedSearch),
                        })}{" "}
                        <AriaButton
                          className={styles.inlineAction}
                          onPress={() => cleanUnavailable(savedSearch)}
                        >
                          {t("schedule.savedSearches.removeUnavailable")}
                        </AriaButton>
                      </p>
                    ) : null}
                    {confirmDelete ? (
                      <div className={styles.confirmation} role="alert">
                        <p>
                          {t("schedule.savedSearches.deleteWarning", { name: savedSearch.name })}
                        </p>
                        <div className={styles.actions}>
                          <Button tone="quiet" onPress={() => deleteSearch(savedSearch)}>
                            {t("schedule.savedSearches.confirmDelete")}
                          </Button>
                          <AriaButton
                            className={styles.inlineAction}
                            onPress={() => setConfirmDelete(false)}
                          >
                            {t("schedule.savedSearches.cancelDelete")}
                          </AriaButton>
                        </div>
                      </div>
                    ) : null}
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    ) : null;

  return (
    <div className={styles.savedSearches}>
      {storageIssue ? (
        <p className={styles.error} role="alert">
          {t("schedule.savedSearches.storageError")}
        </p>
      ) : null}
      <p className={styles.announcement} aria-live="polite">
        {announcement}
      </p>

      {saveActionContainer && saveAction
        ? createPortal(saveAction, saveActionContainer)
        : saveAction}
      {libraryContainer && library ? createPortal(library, libraryContainer) : library}

      <Modal
        className={styles.modal}
        isOpen={saveDialogMode !== undefined}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSaveDialogMode(undefined);
        }}
      >
        <Dialog className={styles.saveDialog} aria-labelledby={`${nameId}-dialog-title`}>
          {({ close }) => (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <Heading slot="title" id={`${nameId}-dialog-title`}>
                {t(
                  saveDialogMode === "draft"
                    ? "schedule.savedSearches.saveDraftTitle"
                    : "schedule.savedSearches.saveTitle",
                )}
              </Heading>
              <p>{criteriaText(criteriaFromScheduleSearch(search))}</p>
              <Label htmlFor={`${nameId}-name`}>{t("schedule.savedSearches.newName")}</Label>
              <Input
                autoFocus
                id={`${nameId}-name`}
                value={name}
                maxLength={SAVED_SEARCH_NAME_MAX_LENGTH}
                onChange={(event) => {
                  setName(event.target.value);
                  setValidationMessage(undefined);
                }}
              />
              {validationMessage ? (
                <p className={styles.error} role="alert">
                  {validationMessage}
                </p>
              ) : null}
              <div className={styles.actions}>
                <Button type="submit">{t("schedule.savedSearches.save")}</Button>
                <Button
                  tone="quiet"
                  onPress={() => {
                    setSaveDialogMode(undefined);
                    close();
                  }}
                >
                  {t("schedule.savedSearches.cancel")}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      </Modal>
    </div>
  );
}
