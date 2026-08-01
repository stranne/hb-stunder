import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useTranslation } from "react-i18next";
import { bookingKeys } from "../features/bookings/api/bookingQueries";
import { SignInAction } from "../features/auth/SignInAction";
import { useSession } from "../features/auth/sessionContext";
import { parseScheduleSearch } from "../features/schedule/model/scheduleSearch";
import { Button } from "../ui/button/Button";
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
        <nav className={styles.nav} aria-label={t("navigation.label")}>
          <Link
            to="/"
            search={(previous) => parseScheduleSearch(previous)}
            activeOptions={{ exact: true }}
          >
            {t("navigation.schedule")}
          </Link>
          <Link to="/bookings">{t("navigation.bookings")}</Link>
        </nav>
        <div className={styles.account}>
          {customer ? (
            <>
              <span className={styles.customerName}>{customer.displayName}</span>
              <Button tone="quiet" onPress={handleSignOut}>
                {t("auth.signOut")}
              </Button>
            </>
          ) : canSignIn ? (
            <SignInAction onSignIn={signIn} />
          ) : null}
        </div>
      </header>
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
}
