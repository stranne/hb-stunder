import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useTranslation } from "react-i18next";
import { bookingKeys } from "../features/bookings/api/bookingQueries";
import { useSession } from "../features/auth/sessionContext";
import { UserMenu } from "../features/auth/UserMenu";
import { parseScheduleSearch } from "../features/schedule/model/scheduleSearch";
import styles from "./AppRoot.module.css";

export function AppRoot() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { customer, canSignIn, signIn, signOut } = useSession();

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
            <Link
              to="/"
              search={(previous) => ({ ...parseScheduleSearch(previous), view: "classes" })}
              activeOptions={{ exact: true }}
            >
              {t("navigation.classes")}
            </Link>
            <Link
              to="/"
              search={(previous) => ({ ...parseScheduleSearch(previous), view: "rooms" })}
              activeOptions={{ exact: true }}
            >
              {t("navigation.rooms")}
            </Link>
            <Link to="/bookings">{t("navigation.bookings")}</Link>
          </nav>
          <div className={styles.account}>
            <UserMenu
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
