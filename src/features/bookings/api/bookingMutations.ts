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
