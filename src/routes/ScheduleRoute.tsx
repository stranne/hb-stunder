import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SchedulePage } from "../features/schedule/components/SchedulePage";
import { useSession } from "../features/auth/sessionContext";
import {
  readSchedulePreferences,
  writeLastUsedFilters,
} from "../features/schedule/model/schedulePreferences";

export function ScheduleRoute() {
  const { customer } = useSession();
  const routeSearch = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const [restoredSearch, setRestoredSearch] = useState(() => {
    if (typeof window === "undefined") return undefined;
    const url = new URLSearchParams(window.location.search);
    const hasExplicitFilters = ["locations", "location", "instructors", "activityTypes"].some(
      (key) => url.has(key),
    );
    const lastUsed = hasExplicitFilters ? undefined : readSchedulePreferences().lastUsed;
    return lastUsed ? { ...routeSearch, ...lastUsed } : undefined;
  });
  const search = restoredSearch ?? routeSearch;

  useEffect(() => {
    if (restoredSearch) {
      void navigate({ search: restoredSearch, replace: true }).then(() =>
        setRestoredSearch(undefined),
      );
    }
  }, [navigate, restoredSearch]);

  useEffect(() => writeLastUsedFilters(search), [search]);

  return (
    <SchedulePage
      search={search}
      onSearchChange={(nextSearch) =>
        void navigate({
          search: nextSearch,
          replace: nextSearch.filters === search.filters,
        })
      }
      customerId={customer?.customerId}
    />
  );
}
