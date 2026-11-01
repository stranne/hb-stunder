import { useEffect, useRef, useState } from "react";
import { setApiAccessToken } from "../../api/client";
import {
  accessTokenExpiresAt,
  isSessionRejected,
  renewSession,
  type AuthenticatedSession,
  type RenewableSession,
} from "./api/auth";
import {
  clearStoredSessions,
  isRenewable,
  readRenewableSession,
  restoreStoredSession,
  updateStoredSession,
} from "./sessionPersistence";

const RENEWAL_MARGIN_MS = 24 * 60 * 60 * 1000;
const MINIMUM_RENEWAL_INTERVAL_MS = 5 * 60 * 1000;
// Browsers run a setTimeout with a longer delay immediately.
const MAXIMUM_TIMER_DELAY_MS = 2 ** 31 - 1;

function runAt(time: number, action: () => void) {
  let timeout = 0;
  const wait = () => {
    const delay = time - Date.now();
    timeout = window.setTimeout(
      delay > MAXIMUM_TIMER_DELAY_MS ? wait : action,
      Math.max(0, Math.min(delay, MAXIMUM_TIMER_DELAY_MS)),
    );
  };

  wait();
  return () => window.clearTimeout(timeout);
}

function findRenewableSession(session: AuthenticatedSession | undefined) {
  // Once its access token has expired, a remembered session exists only in storage.
  if (!session) return readRenewableSession();
  return isRenewable(session) ? session : undefined;
}

function isStillStored(session: RenewableSession) {
  return readRenewableSession()?.refreshToken === session.refreshToken;
}

/**
 * Keeps an authenticated session alive for as long as it can be renewed. The customer appears signed
 * out once the access token has expired, but a remembered session stays stored and returns as soon as
 * renewal succeeds. Only the server refusing the refresh token ends it.
 */
export function useSessionLifetime(
  session: AuthenticatedSession | undefined,
  setSession: (session: AuthenticatedSession | undefined) => void,
) {
  const lastRenewalAttempt = useRef(0);
  const isRenewing = useRef(false);
  const [finishedRenewals, setFinishedRenewals] = useState(0);

  useEffect(() => {
    if (!session) return;

    const expiresAt = accessTokenExpiresAt(session.accessToken);
    if (!expiresAt) return;

    return runAt(expiresAt, () => {
      if (!session.refreshToken) clearStoredSessions();
      setApiAccessToken(undefined);
      setSession(undefined);
    });
  }, [session, setSession]);

  useEffect(() => {
    const renewableSession = findRenewableSession(session);
    if (!renewableSession) return;

    const replaceSession = (nextSession: AuthenticatedSession | undefined) => {
      setApiAccessToken(nextSession?.accessToken);
      setSession(nextSession);
    };

    const renew = async () => {
      if (isRenewing.current) return;

      isRenewing.current = true;
      lastRenewalAttempt.current = Date.now();

      try {
        const renewedSession = await renewSession(renewableSession);
        if (isStillStored(renewableSession)) {
          updateStoredSession(renewedSession);
          replaceSession(renewedSession);
        } else {
          // The customer signed out or in again while the request was in flight.
          replaceSession(restoreStoredSession());
        }
      } catch (error) {
        if (isSessionRejected(error)) {
          if (isStillStored(renewableSession)) clearStoredSessions();
          replaceSession(restoreStoredSession());
        }
      } finally {
        isRenewing.current = false;
        setFinishedRenewals((count) => count + 1);
      }
    };

    const renewalDueAt =
      (accessTokenExpiresAt(renewableSession.accessToken) ?? 0) - RENEWAL_MARGIN_MS;

    // Timers stall while a device sleeps, and a failed attempt should not wait out the interval when
    // the customer returns or the connection does.
    const renewIfDue = () => {
      if (!document.hidden && Date.now() >= renewalDueAt) void renew();
    };

    const cancelTimer = runAt(
      Math.max(renewalDueAt, lastRenewalAttempt.current + MINIMUM_RENEWAL_INTERVAL_MS),
      () => void renew(),
    );
    document.addEventListener("visibilitychange", renewIfDue);
    window.addEventListener("online", renewIfDue);

    return () => {
      cancelTimer();
      document.removeEventListener("visibilitychange", renewIfDue);
      window.removeEventListener("online", renewIfDue);
    };
  }, [session, setSession, finishedRenewals]);
}
