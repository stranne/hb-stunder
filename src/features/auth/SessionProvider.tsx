import { useEffect, useMemo, useState, type ReactNode } from "react";
import { setApiAccessToken } from "../../api/client";
import {
  loadCustomerDisplayName,
  login,
  type AuthenticatedSession,
  type LoginCredentials,
} from "./api/auth";
import { SessionContext, type SessionContextValue } from "./sessionContext";
import {
  clearStoredSessions,
  restoreStoredSession,
  storeNewSession,
  updateStoredSession,
} from "./sessionPersistence";
import { useSessionLifetime } from "./useSessionLifetime";

function restoreSession(): AuthenticatedSession | undefined {
  if (typeof window === "undefined") return undefined;

  const session = restoreStoredSession();
  if (session) setApiAccessToken(session.accessToken);
  return session;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(restoreSession);

  useSessionLifetime(session, setSession);

  useEffect(() => {
    if (!session || (session.displayName && session.displayName !== session.customerId)) return;

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
        setSession(storeNewSession(await login(credentials), remember));
      },
      signOut: () => {
        clearStoredSessions();
        setApiAccessToken(undefined);
        setSession(undefined);
      },
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
