import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useLinkProps, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Calendar, CalendarCheck } from "iconoir-react";
import { useTranslation } from "react-i18next";
import {
  bookingKeys,
  customerGroupActivityBookingsQueryOptions,
} from "../features/bookings/api/bookingQueries";
import { useSession } from "../features/auth/sessionContext";
import { AppMenu } from "./AppMenu";
import { BrandMark } from "./BrandMark";
import {
  applyColorMode,
  readColorModePreference,
  writeColorModePreference,
  type ColorModePreference,
} from "./colorMode";
import interactionStyles from "../ui/interaction/Interaction.module.css";
import { parseScheduleSearch } from "../features/schedule/model/scheduleSearch";
import styles from "./AppRoot.module.css";

export function AppRoot() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { customer, canSignIn, signIn, signOut } = useSession();
  const [colorModePreference, setColorModePreference] = useState(readColorModePreference);
  const customerId = customer?.customerId;
  const previousCustomerId = useRef(customerId);
  const bookings = useQuery(customerGroupActivityBookingsQueryOptions(customerId));
  const bookingCount = bookings.data?.length;

  // Covers every way a session ends, including expiry and a sign-out in another tab.
  useEffect(() => {
    const previous = previousCustomerId.current;
    previousCustomerId.current = customerId;
    if (previous && previous !== customerId) {
      queryClient.removeQueries({ queryKey: bookingKeys.customer(previous) });
    }
  }, [customerId, queryClient]);

  useEffect(() => {
    applyColorMode(colorModePreference);
    if (colorModePreference !== "system") return;

    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyColorMode("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [colorModePreference]);
  // The schedule keeps its own view and filters, so returning to it continues where it was left.
  const scheduleLinkProps = useLinkProps({
    to: "/",
    search: (previous) => parseScheduleSearch(previous),
  });
  const bookingsLinkProps = useLinkProps({ to: "/bookings" });
  const [brandPrefix, ...brandRest] = t("app.name").split(" ");

  const handleColorModeChange = (preference: ColorModePreference) => {
    writeColorModePreference(preference);
    setColorModePreference(preference);
  };

  return (
    <>
      <header className={styles.shellHeader}>
        <div className={styles.masthead}>
          <nav className={styles.nav} aria-label={t("navigation.label")}>
            <a
              {...scheduleLinkProps}
              className={`${interactionStyles.control} ${interactionStyles.quiet} ${interactionStyles.selectable}`}
              aria-current={location.pathname === "/" ? "page" : undefined}
            >
              <Calendar aria-hidden="true" />
              <span>{t("navigation.schedule")}</span>
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
          </nav>
          <a
            {...scheduleLinkProps}
            className={`${styles.brand} ${interactionStyles.focusRing}`}
            aria-current={undefined}
          >
            <BrandMark />
            <span>
              {brandPrefix} <em>{brandRest.join(" ")}</em>
            </span>
          </a>
          <div className={styles.account}>
            <AppMenu
              customer={customer}
              canSignIn={canSignIn}
              onSignIn={signIn}
              onSignOut={signOut}
              colorModePreference={colorModePreference}
              onColorModeChange={handleColorModeChange}
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
