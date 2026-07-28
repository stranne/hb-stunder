import { useNavigate, useSearch } from "@tanstack/react-router";
import { SchedulePage } from "../features/schedule/components/SchedulePage";

export function ScheduleRoute() {
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });

  return (
    <SchedulePage
      search={search}
      onSearchChange={(nextSearch) => void navigate({ search: nextSearch, replace: true })}
    />
  );
}
