import { useEffect, useMemo, useState, type ReactNode } from "react";
import { setApiAccessToken } from "../../api/client";
import { MOCK_CUSTOMER_ID } from "../../mocks/mockSession";
import {
  accessTokenExpiresAt,
  login,
  type AuthenticatedSession,
  type LoginCredentials,
} from "./api/auth";
import { SessionContext, type CustomerSession, type SessionContextValue } from "./sessionContext";

const MOCK_SESSION_STORAGE_KEY = "hb-stunder.mock-session";
const REAL_SESSION_STORAGE_KEY = "hb-stunder.session";

function mockSignInEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true";
}

function restoreStoredSession(storage: Storage): AuthenticatedSession | undefined {
  const stored = storage.getItem(REAL_SESSION_STORAGE_KEY);
  if (!stored) return undefined;

  try {
    const session = JSON.parse(stored) as AuthenticatedSession;
    const expiresAt = session.accessToken && accessTokenExpiresAt(session.accessToken);
    if (!session.customerId || !expiresAt || expiresAt <= Date.now()) {
      storage.removeItem(REAL_SESSION_STORAGE_KEY);
      return undefined;
    }
    return session;
  } catch {
    storage.removeItem(REAL_SESSION_STORAGE_KEY);
    return undefined;
  }
}

function restoreSession(mockEnabled: boolean): AuthenticatedSession | CustomerSession | undefined {
  if (typeof window === "undefined") return undefined;

  if (mockEnabled) {
    return window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY) === "signed-in"
      ? { customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" }
      : undefined;
  }

  const session =
    restoreStoredSession(window.localStorage) ?? restoreStoredSession(window.sessionStorage);
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

  useEffect(() => {
    if (!("accessToken" in (session ?? {}))) return;

    const authenticatedSession = session as AuthenticatedSession;
    const expiresAt = accessTokenExpiresAt(authenticatedSession.accessToken);
    if (!expiresAt) return;

    const timeout = window.setTimeout(
      () => {
        window.localStorage.removeItem(REAL_SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(REAL_SESSION_STORAGE_KEY);
        setApiAccessToken(undefined);
        setSession(undefined);
      },
      Math.max(0, expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      customer: session
        ? { customerId: session.customerId, displayName: session.displayName }
        : undefined,
      canSignIn: true,
      signIn: async (credentials: LoginCredentials, remember = false) => {
        if (mockEnabled) {
          window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, "signed-in");
          setSession({ customerId: MOCK_CUSTOMER_ID, displayName: "Mock Customer" });
          return;
        }

        const authenticatedSession = await login(credentials);
        const storage = remember ? window.localStorage : window.sessionStorage;
        const otherStorage = remember ? window.sessionStorage : window.localStorage;
        otherStorage.removeItem(REAL_SESSION_STORAGE_KEY);
        storage.setItem(REAL_SESSION_STORAGE_KEY, JSON.stringify(authenticatedSession));
        setSession(authenticatedSession);
      },
      signOut: () => {
        window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
        window.localStorage.removeItem(REAL_SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(REAL_SESSION_STORAGE_KEY);
        setApiAccessToken(undefined);
        setSession(undefined);
      },
    }),
    [session, mockEnabled],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
