import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { ApiError } from "../../../api/errors";
import { scheduleKeys } from "../../schedule/api/scheduleQueries";
import { bookingKeys } from "./bookingQueries";

export type CreateGroupActivityBookingVariables = {
  customerId: string;
  groupActivity: number;
  allowWaitingList: boolean;
};

export type CancelGroupActivityBookingVariables = {
  customerId: string;
  bookingId: number;
};

export function cancelGroupActivityBookingMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...bookingKeys.all, "cancel-group-activity"] as const,
    mutationFn: async ({ customerId, bookingId }: CancelGroupActivityBookingVariables) => {
      const { error, response } = await apiClient.DELETE(
        "/customers/{customerId}/bookings/groupactivities/{bookingId}",
        {
          params: {
            path: { customerId, bookingId: String(bookingId) },
            query: { bookingType: "groupActivityBooking" },
          },
        },
      );

      if (!response.ok) {
        throw new ApiError("Could not cancel group activity booking", response.status, error);
      }
    },
    onSuccess: async (_data, { customerId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: bookingKeys.groupActivities(customerId),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: scheduleKeys.lists(),
          refetchType: "all",
        }),
      ]);
    },
    retry: false,
  });
}

export function createGroupActivityBookingMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...bookingKeys.all, "create-group-activity"] as const,
    mutationFn: async ({
      customerId,
      groupActivity,
      allowWaitingList,
    }: CreateGroupActivityBookingVariables) => {
      const { error, response } = await apiClient.POST(
        "/customers/{customerId}/bookings/groupactivities",
        {
          params: { path: { customerId } },
          body: { groupActivity, allowWaitingList },
        },
      );

      if (!response.ok) {
        throw new ApiError("Could not create group activity booking", response.status, error);
      }
    },
    onSuccess: async (_data, { customerId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: bookingKeys.groupActivities(customerId),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: scheduleKeys.lists(),
          refetchType: "all",
        }),
      ]);
    },
    retry: false,
  });
}
