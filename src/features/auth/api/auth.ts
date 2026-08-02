import { apiClient, setApiAccessToken } from "../../../api/client";
import { ApiError } from "../../../api/errors";
import type { CustomerSession } from "../sessionContext";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthenticatedSession extends CustomerSession {
  accessToken: string;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findString(value: unknown, keys: string[], depth = 0): string | undefined {
  if (depth > 4 || !isObject(value)) return undefined;

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (typeof candidate === "number") return String(candidate);
  }

  for (const candidate of Object.values(value)) {
    const found = findString(candidate, keys, depth + 1);
    if (found) return found;
  }

  return undefined;
}

function decodeJwtPayload(token: string): unknown {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return undefined;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
      (character) => character.charCodeAt(0),
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return undefined;
  }
}

export function accessTokenExpiresAt(token: string): number | undefined {
  const payload = decodeJwtPayload(token);
  if (!isObject(payload) || typeof payload.exp !== "number" || !Number.isFinite(payload.exp))
    return undefined;

  return payload.exp * 1000;
}

function bearerToken(data: unknown, response: Response) {
  const authorization = response.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) return authorization.slice(7);
  if (typeof data === "string" && data.trim()) return data;

  return findString(data, ["access_token", "accessToken", "token", "jwt"]);
}

function customerSession(data: unknown, token: string): CustomerSession | undefined {
  const jwt = decodeJwtPayload(token);
  const responseCustomer = isObject(data) ? data.customer : undefined;
  const tokenCustomer = isObject(jwt) ? jwt.customer : undefined;
  const customerId =
    findString(data, ["customerId", "customer_id"]) ??
    findString(jwt, ["customerId", "customer_id"]) ??
    (typeof responseCustomer === "string" || typeof responseCustomer === "number"
      ? String(responseCustomer)
      : findString(responseCustomer, ["id", "customerId"])) ??
    (typeof tokenCustomer === "string" || typeof tokenCustomer === "number"
      ? String(tokenCustomer)
      : findString(tokenCustomer, ["id", "customerId"])) ??
    (isObject(data) && (typeof data.id === "string" || typeof data.id === "number")
      ? String(data.id)
      : undefined) ??
    findString(jwt, ["sub"]);

  if (!customerId) return undefined;

  const firstName = findString(data, ["firstName", "given_name"]);
  const lastName = findString(data, ["lastName", "family_name"]);
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    findString(data, ["displayName", "fullName", "name"]) ||
    findString(jwt, ["name", "preferred_username"]) ||
    customerId;

  return { customerId, displayName };
}

export async function login(credentials: LoginCredentials): Promise<AuthenticatedSession> {
  const { data, error, response } = await apiClient.POST("/auth/login", {
    body: credentials,
  });

  if (error || !response.ok) {
    throw new ApiError("Sign-in failed", response.status, error);
  }

  const accessToken = bearerToken(data, response);
  if (!accessToken) {
    throw new ApiError("The sign-in response did not contain an access token", response.status);
  }

  const customer = customerSession(data, accessToken);
  if (!customer) {
    throw new ApiError("The sign-in response did not contain a customer identity", response.status);
  }

  setApiAccessToken(accessToken);
  return { ...customer, accessToken };
}
