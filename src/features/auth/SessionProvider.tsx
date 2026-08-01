import { useMemo, useState, type ReactNode } from "react";
import { setApiAccessToken } from "../../api/client";
import { MOCK_CUSTOMER_ID } from "../../mocks/mockSession";
import { login, type AuthenticatedSession, type LoginCredentials } from "./api/auth";
import { SessionContext, type CustomerSession, type SessionContextValue } from "./sessionContext";

const MOCK_SESSION_STORAGE_KEY = "hb-stunder.mock-session";
const REAL_SESSION_STORAGE_KEY = "hb-stunder.session";

function mockSignInEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true";
}

function restoreSession(mockEnabled: boolean): CustomerSession | undefined {
  if (typeof window === "undefined") return undefined;

  if (mockEnabled) {
    return window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY) === "signed-in"
      ? { customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" }
      : undefined;
  }

  const stored = window.sessionStorage.getItem(REAL_SESSION_STORAGE_KEY);
  if (!stored) return undefined;

  try {
    const session = JSON.parse(stored) as AuthenticatedSession;
    if (!session.customerId || !session.accessToken) return undefined;
    setApiAccessToken(session.accessToken);
    return { customerId: session.customerId, displayName: session.displayName };
  } catch {
    window.sessionStorage.removeItem(REAL_SESSION_STORAGE_KEY);
    return undefined;
  }
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
  const [customer, setCustomer] = useState<CustomerSession | undefined>(() =>
    initiallySignedIn
      ? { customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" }
      : restoreSession(mockEnabled),
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      customer,
      canSignIn: true,
      signIn: async (credentials: LoginCredentials) => {
        if (mockEnabled) {
          window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, "signed-in");
          setCustomer({ customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" });
          return;
        }

        const session = await login(credentials);
        window.sessionStorage.setItem(REAL_SESSION_STORAGE_KEY, JSON.stringify(session));
        setCustomer({ customerId: session.customerId, displayName: session.displayName });
      },
      signOut: () => {
        window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(REAL_SESSION_STORAGE_KEY);
        setApiAccessToken(undefined);
        setCustomer(undefined);
      },
    }),
    [customer, mockEnabled],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
