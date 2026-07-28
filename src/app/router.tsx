import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppRoot } from "./AppRoot";
import { FoundationPage } from "./FoundationPage";

const rootRoute = createRootRoute({ component: AppRoot });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FoundationPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
