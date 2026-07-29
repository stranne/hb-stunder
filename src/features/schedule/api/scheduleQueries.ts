import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { ApiError } from "../../../api/errors";
import type { ScheduleFilters } from "../model/schedule";
import { getStockholmDayPeriod } from "../model/scheduleDate";

export const scheduleKeys = {
  all: ["classes"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: (filters: ScheduleFilters) => [...scheduleKeys.lists(), filters] as const,
};

export function scheduleQueryOptions(filters: ScheduleFilters) {
  const period = getStockholmDayPeriod(filters.date);

  return queryOptions({
    queryKey: scheduleKeys.list(filters),
    queryFn: async ({ signal }) => {
      const { data, error, response } = await apiClient.GET(
        "/businessunits/{businessUnit}/groupactivities",
        {
          params: {
            path: { businessUnit: filters.businessUnit },
            query: { "period.start": period.start, "period.end": period.end },
          },
          signal,
        },
      );

      if (!response.ok || !data) {
        throw new ApiError("Could not load the schedule", response.status, error);
      }

      return data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 20_000,
    refetchInterval: 60_000,
  });
}
