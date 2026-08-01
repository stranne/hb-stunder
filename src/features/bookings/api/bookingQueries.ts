import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { ApiError } from "../../../api/errors";

export const bookingKeys = {
  all: ["bookings"] as const,
  customer: (customerId: string) => [...bookingKeys.all, "customer", customerId] as const,
  groupActivities: (customerId: string) =>
    [...bookingKeys.customer(customerId), "group-activities"] as const,
};

export function customerGroupActivityBookingsQueryOptions(customerId: string | undefined) {
  return queryOptions({
    queryKey: bookingKeys.groupActivities(customerId ?? "signed-out"),
    queryFn: async ({ signal }) => {
      if (!customerId) return [];

      const { data, error, response } = await apiClient.GET(
        "/customers/{customerId}/bookings/groupactivities",
        {
          params: { path: { customerId } },
          signal,
        },
      );

      if (!response.ok || !data) {
        throw new ApiError("Could not load customer bookings", response.status, error);
      }

      return data;
    },
    enabled: Boolean(customerId),
    staleTime: 20_000,
  });
}
