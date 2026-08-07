import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useLinkProps, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Calendar, CalendarCheck, ViewGrid } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { bookingKeys } from "../features/bookings/api/bookingQueries";
import { useSession } from "../features/auth/sessionContext";
import { AppMenu } from "./AppMenu";
import interactionStyles from "../ui/interaction/Interaction.module.css";
import { parseScheduleSearch } from "../features/schedule/model/scheduleSearch";
import styles from "./AppRoot.module.css";

export function AppRoot() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { customer, canSignIn, signIn, signOut } = useSession();
  const scheduleView = parseScheduleSearch(location.search).view;
  const classesLinkProps = useLinkProps({
    to: "/",
    search: (previous) => ({ ...parseScheduleSearch(previous), view: "classes" }),
  });
  const roomsLinkProps = useLinkProps({
    to: "/",
    search: (previous) => ({ ...parseScheduleSearch(previous), view: "rooms" }),
  });
  const bookingsLinkProps = useLinkProps({ to: "/bookings" });

  const handleSignOut = () => {
    if (customer)
      queryClient.removeQueries({ queryKey: bookingKeys.customer(customer.customerId) });
    signOut();
  };

  return (
    <>
      <header className={styles.shellHeader}>
        <div className={styles.navigationBar}>
          <nav className={styles.nav} aria-label={t("navigation.label")}>
            <a
              {...classesLinkProps}
              className={`${interactionStyles.control} ${interactionStyles.quiet} ${interactionStyles.selectable}`}
              aria-current={
                location.pathname === "/" && scheduleView === "classes" ? "page" : undefined
              }
            >
              <Calendar aria-hidden="true" />
              <span>{t("navigation.classes")}</span>
            </a>
            <a
              {...roomsLinkProps}
              className={`${interactionStyles.control} ${interactionStyles.quiet} ${interactionStyles.selectable}`}
              aria-current={
                location.pathname === "/" && scheduleView === "rooms" ? "page" : undefined
              }
            >
              <ViewGrid aria-hidden="true" />
              <span>{t("navigation.rooms")}</span>
            </a>
            <a
              {...bookingsLinkProps}
              className={`${interactionStyles.control} ${interactionStyles.quiet} ${interactionStyles.selectable}`}
              aria-current={location.pathname === "/bookings" ? "page" : undefined}
            >
              <CalendarCheck aria-hidden="true" />
              <span>{t("navigation.bookings")}</span>
            </a>
          </nav>
          <div className={styles.account}>
            <AppMenu
              customer={customer}
              canSignIn={canSignIn}
              onSignIn={signIn}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </header>
      <div className={styles.content}>
        <Outlet />
      </div>
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
}
