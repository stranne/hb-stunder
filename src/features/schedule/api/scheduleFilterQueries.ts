import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { ApiError } from "../../../api/errors";

export interface ScheduleFilterOption {
  id: number;
  name: string;
  /** Known business-unit IDs for options whose API metadata is usable. */
  businessUnitIds?: number[];
}

function validBusinessUnitIds(businessUnits: unknown): number[] | undefined {
  if (!Array.isArray(businessUnits)) return undefined;

  const ids = [
    ...new Set(
      businessUnits
        .map((businessUnit) =>
          typeof businessUnit === "object" && businessUnit !== null && "id" in businessUnit
            ? businessUnit.id
            : undefined,
        )
        .filter((id): id is number => Number.isInteger(id) && id > 0),
    ),
  ];
  return ids.length > 0 ? ids : undefined;
}

export const scheduleFilterKeys = {
  all: ["schedule-filter-options"] as const,
  instructors: () => [...scheduleFilterKeys.all, "instructors"] as const,
  activityTypes: () => [...scheduleFilterKeys.all, "activity-types"] as const,
};

export function instructorQueryOptions() {
  return queryOptions({
    queryKey: scheduleFilterKeys.instructors(),
    queryFn: async ({ signal }) => {
      const { data, error, response } = await apiClient.GET("/services/groupactivityinstructors", {
        signal,
      });
      if (!response.ok || !data) {
        throw new ApiError("Could not load instructors", response.status, error);
      }
      return data.filter(
        (item): item is typeof item & ScheduleFilterOption =>
          typeof item.id === "number" && typeof item.name === "string",
      );
    },
    staleTime: 5 * 60_000,
  });
}

export function activityTypeQueryOptions() {
  return queryOptions({
    queryKey: scheduleFilterKeys.activityTypes(),
    queryFn: async ({ signal }) => {
      const { data, error, response } = await apiClient.GET("/products/groupactivities", {
        params: { query: { webCategory: 2 } },
        signal,
      });
      if (!response.ok || !data) {
        throw new ApiError("Could not load class types", response.status, error);
      }
      return data
        .filter(
          (item): item is typeof item & Required<Pick<ScheduleFilterOption, "id" | "name">> =>
            typeof item.id === "number" && typeof item.name === "string",
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          businessUnitIds: validBusinessUnitIds(item.businessUnits),
        }));
    },
    staleTime: 5 * 60_000,
  });
}
