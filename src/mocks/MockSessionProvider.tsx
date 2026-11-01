import { useMemo, useState, type ReactNode } from "react";
import { SessionContext, type SessionContextValue } from "../features/auth/sessionContext";
import { MOCK_CUSTOMER_ID } from "./mockSession";

const MOCK_SESSION_STORAGE_KEY = "hb-stunder.mock-session";
const MOCK_CUSTOMER = { customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" };

/** Replaces the real session in stories, tests, and development with `VITE_ENABLE_MSW=true`. */
export function MockSessionProvider({
  children,
  initiallySignedIn = false,
}: {
  children: ReactNode;
  initiallySignedIn?: boolean;
}) {
  const [isSignedIn, setIsSignedIn] = useState(
    () =>
      initiallySignedIn || window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY) === "signed-in",
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      customer: isSignedIn ? MOCK_CUSTOMER : undefined,
      canSignIn: true,
      signIn: async () => {
        window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, "signed-in");
        setIsSignedIn(true);
      },
      signOut: () => {
        window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
        setIsSignedIn(false);
      },
    }),
    [isSignedIn],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
