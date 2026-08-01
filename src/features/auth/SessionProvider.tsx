import { useMemo, useState, type ReactNode } from "react";
import { MOCK_CUSTOMER_ID } from "../../mocks/mockSession";
import { SessionContext, type CustomerSession, type SessionContextValue } from "./sessionContext";

const MOCK_SESSION_STORAGE_KEY = "hb-stunder.mock-session";

function mockSignInEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true";
}

function hasStoredMockSession(enabled: boolean) {
  return (
    enabled &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY) === "signed-in"
  );
}

export function SessionProvider({
  children,
  mockEnabled = mockSignInEnabled(),
  initiallySignedIn,
}: {
  children: ReactNode;
  mockEnabled?: boolean;
  initiallySignedIn?: boolean;
}) {
  const [customer, setCustomer] = useState<CustomerSession | undefined>(() => {
    if (initiallySignedIn ?? hasStoredMockSession(mockEnabled)) {
      return { customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" };
    }
    return undefined;
  });

  const value = useMemo<SessionContextValue>(
    () => ({
      customer,
      canSignIn: mockEnabled,
      signIn: () => {
        if (!mockEnabled) return;
        window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, "signed-in");
        setCustomer({ customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" });
      },
      signOut: () => {
        window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
        setCustomer(undefined);
      },
    }),
    [customer, mockEnabled],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
