import { useEffect, useMemo, useState, type ReactNode } from "react";
import { setApiAccessToken } from "../../api/client";
import { MOCK_CUSTOMER_ID } from "../../mocks/mockSession";
import {
  loadCustomerDisplayName,
  login,
  type AuthenticatedSession,
  type LoginCredentials,
} from "./api/auth";
import { SessionContext, type CustomerSession, type SessionContextValue } from "./sessionContext";
import {
  clearStoredSessions,
  restoreStoredSession,
  storeNewSession,
  updateStoredSession,
} from "./sessionPersistence";
import { useSessionLifetime } from "./useSessionLifetime";

const MOCK_SESSION_STORAGE_KEY = "hb-stunder.mock-session";

function mockSignInEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true";
}

function restoreSession(mockEnabled: boolean): AuthenticatedSession | CustomerSession | undefined {
  if (typeof window === "undefined") return undefined;

  if (mockEnabled) {
    return window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY) === "signed-in"
      ? { customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" }
      : undefined;
  }

  const session = restoreStoredSession();
  if (session) setApiAccessToken(session.accessToken);
  return session;
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
  const [session, setSession] = useState<AuthenticatedSession | CustomerSession | undefined>(() =>
    initiallySignedIn
      ? { customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" }
      : restoreSession(mockEnabled),
  );

  useSessionLifetime(session, setSession, !mockEnabled);

  useEffect(() => {
    if (
      !session ||
      !("accessToken" in session) ||
      (session.displayName && session.displayName !== session.customerId)
    )
      return;

    let cancelled = false;
    void loadCustomerDisplayName(session.customerId).then((displayName) => {
      if (cancelled || !displayName) return;

      const updatedSession = { ...session, displayName };
      updateStoredSession(updatedSession);
      setSession(updatedSession);
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      customer: session
        ? {
            customerId: session.customerId,
            displayName:
              session.displayName !== session.customerId ? session.displayName : undefined,
          }
        : undefined,
      canSignIn: true,
      signIn: async (credentials: LoginCredentials, remember = false) => {
        if (mockEnabled) {
          window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, "signed-in");
          setSession({ customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" });
          return;
        }

        setSession(storeNewSession(await login(credentials), remember));
      },
      signOut: () => {
        window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
        clearStoredSessions();
        setApiAccessToken(undefined);
        setSession(undefined);
      },
    }),
    [session, mockEnabled],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
