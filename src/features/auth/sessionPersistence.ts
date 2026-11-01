import { accessTokenExpiresAt, type AuthenticatedSession, type RenewableSession } from "./api/auth";

const SESSION_STORAGE_KEY = "hb-stunder.session";
const SESSION_CHANNEL_NAME = "hb-stunder.session";

function hasUsableAccessToken(session: AuthenticatedSession) {
  const expiresAt = accessTokenExpiresAt(session.accessToken);
  return expiresAt !== undefined && expiresAt > Date.now();
}

export function isRenewable(session: AuthenticatedSession): session is RenewableSession {
  return Boolean(session.refreshToken);
}

function readStoredSession(storage: Storage): AuthenticatedSession | undefined {
  const stored = storage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return undefined;

  try {
    const session = JSON.parse(stored) as AuthenticatedSession;
    if (session.customerId && session.accessToken) return session;
  } catch {
    // An unreadable entry is removed below, like one with missing fields.
  }

  storage.removeItem(SESSION_STORAGE_KEY);
  return undefined;
}

function restoreSessionFrom(storage: Storage) {
  const session = readStoredSession(storage);
  if (!session) return undefined;
  if (hasUsableAccessToken(session)) return session;

  // An expired session stays stored while its refresh token can still renew it.
  if (!isRenewable(session)) storage.removeItem(SESSION_STORAGE_KEY);
  return undefined;
}

/** Returns the stored session whose access token can be used right now. */
export function restoreStoredSession() {
  return restoreSessionFrom(window.localStorage) ?? restoreSessionFrom(window.sessionStorage);
}

/** Returns the remembered session that holds a refresh token, whether or not it has expired. */
export function readRenewableSession() {
  const session = readStoredSession(window.localStorage);
  return session && isRenewable(session) ? session : undefined;
}

/**
 * Stores a new sign-in and returns the session to use. Only a remembered session keeps its refresh
 * token, because that token does not expire and would outlive the temporary session's intent.
 */
export function storeNewSession(session: AuthenticatedSession, remember: boolean) {
  const newSession = { ...session };
  if (!remember) delete newSession.refreshToken;

  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  otherStorage.removeItem(SESSION_STORAGE_KEY);
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));

  return newSession;
}

/** Replaces the stored copy of the current session, wherever it was kept. */
export function updateStoredSession(session: AuthenticatedSession) {
  const storage = window.localStorage.getItem(SESSION_STORAGE_KEY)
    ? window.localStorage
    : window.sessionStorage;
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSessions() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Tells other tabs that the customer signed out. Storage events cannot do this, because a duplicated
 * tab keeps its own copy of a temporary session in session storage.
 */
export function announceSignOut() {
  const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
  channel.postMessage("signed-out");
  channel.close();
}

/** Runs the listener when a tab announces a sign-out, and returns a function that stops listening. */
export function listenForSignOut(listener: () => void) {
  const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
  channel.addEventListener("message", listener);
  return () => channel.close();
}
