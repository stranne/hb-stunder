import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { parseScheduleSearch } from "../features/schedule/model/scheduleSearch";
import { BookingsRoute } from "../routes/BookingsRoute";
import { ScheduleRoute } from "../routes/ScheduleRoute";
import { AppRoot } from "./AppRoot";

const rootRoute = createRootRoute({ component: AppRoot });
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: parseScheduleSearch,
  component: ScheduleRoute,
});

export const bookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bookings",
  component: BookingsRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, bookingsRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
