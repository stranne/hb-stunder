import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { ApiError } from "../../../api/errors";
import type { ScheduleFilters } from "../model/schedule";
import { getStockholmDayPeriod } from "../model/scheduleDate";

export const scheduleKeys = {
  all: ["classes"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: (filters: ScheduleFilters) => [...scheduleKeys.lists(), filters] as const,
  details: () => [...scheduleKeys.all, "detail"] as const,
  detail: (businessUnit: number | undefined, activityId: number | undefined) =>
    [...scheduleKeys.details(), businessUnit, activityId] as const,
};

export function groupActivityQueryOptions(
  businessUnit: number | undefined,
  activityId: number | undefined,
) {
  return queryOptions({
    queryKey: scheduleKeys.detail(businessUnit, activityId),
    queryFn: async ({ signal }) => {
      if (businessUnit === undefined || activityId === undefined) {
        throw new Error("A business unit and activity are required");
      }

      const { data, error, response } = await apiClient.GET(
        "/businessunits/{businessUnit}/groupactivities/{activityId}",
        {
          params: { path: { businessUnit, activityId } },
          signal,
        },
      );

      if (!response.ok || !data) {
        throw new ApiError("Could not load the group activity", response.status, error);
      }

      return data;
    },
    enabled: businessUnit !== undefined && activityId !== undefined,
    staleTime: 20_000,
  });
}

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
