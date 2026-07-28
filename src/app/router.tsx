import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { parseScheduleSearch } from "../features/schedule/model/scheduleSearch";
import { ScheduleRoute } from "../routes/ScheduleRoute";
import { AppRoot } from "./AppRoot";

const rootRoute = createRootRoute({ component: AppRoot });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: parseScheduleSearch,
  component: ScheduleRoute,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
