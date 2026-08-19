import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useLinkProps, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Calendar, CalendarCheck, FilterList, ViewGrid } from "iconoir-react";
import { useTranslation } from "react-i18next";
import {
  bookingKeys,
  customerGroupActivityBookingsQueryOptions,
} from "../features/bookings/api/bookingQueries";
import { useSession } from "../features/auth/sessionContext";
import { AppMenu } from "./AppMenu";
import {
  applyColorMode,
  readColorModePreference,
  writeColorModePreference,
  type ColorModePreference,
} from "./colorMode";
import interactionStyles from "../ui/interaction/Interaction.module.css";
import { LOCATION_IDS, parseScheduleSearch } from "../features/schedule/model/scheduleSearch";
import styles from "./AppRoot.module.css";

export function AppRoot() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { customer, canSignIn, signIn, signOut } = useSession();
  const scheduleSearch = parseScheduleSearch(location.search);
  const scheduleView = scheduleSearch.view;
  const activeFilterCount =
    Number(scheduleSearch.locations.length < LOCATION_IDS.length) +
    Number(scheduleSearch.instructors.length > 0) +
    Number(scheduleSearch.activityTypes.length > 0);
  const [colorModePreference, setColorModePreference] = useState(readColorModePreference);
  const bookings = useQuery(customerGroupActivityBookingsQueryOptions(customer?.customerId));
  const bookingCount = bookings.data?.length;

  useEffect(() => {
    applyColorMode(colorModePreference);
    if (colorModePreference !== "system") return;

    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyColorMode("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [colorModePreference]);
  const classesLinkProps = useLinkProps({
    to: "/",
    search: (previous) => ({ ...parseScheduleSearch(previous), view: "classes" }),
  });
  const roomsLinkProps = useLinkProps({
    to: "/",
    search: (previous) => ({ ...parseScheduleSearch(previous), view: "rooms" }),
  });
  const filtersLinkProps = useLinkProps({
    to: "/",
    search: (previous) => ({ ...parseScheduleSearch(previous), view: "filters" }),
  });
  const bookingsLinkProps = useLinkProps({ to: "/bookings" });

  const handleSignOut = () => {
    if (customer)
      queryClient.removeQueries({ queryKey: bookingKeys.customer(customer.customerId) });
    signOut();
  };

  const handleColorModeChange = (preference: ColorModePreference) => {
    writeColorModePreference(preference);
    setColorModePreference(preference);
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
              {bookingCount !== undefined ? (
                <>
                  <span className={styles.navCount} aria-hidden="true">
                    {bookingCount}
                  </span>
                  <span className={styles.visuallyHidden}>
                    {t("navigation.bookingCount", { count: bookingCount })}
                  </span>
                </>
              ) : null}
            </a>
            <a
              {...filtersLinkProps}
              className={`${interactionStyles.control} ${interactionStyles.quiet} ${interactionStyles.selectable}`}
              aria-current={
                location.pathname === "/" && scheduleView === "filters" ? "page" : undefined
              }
            >
              <FilterList aria-hidden="true" />
              <span>{t("schedule.filters.filters")}</span>
              {activeFilterCount > 0 ? (
                <span className={styles.navCount} aria-hidden="true">
                  {activeFilterCount}
                </span>
              ) : null}
            </a>
          </nav>
          <div className={styles.utilities}>
            <div className={styles.account}>
              <AppMenu
                customer={customer}
                canSignIn={canSignIn}
                onSignIn={signIn}
                onSignOut={handleSignOut}
                colorModePreference={colorModePreference}
                onColorModeChange={handleColorModeChange}
              />
            </div>
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
