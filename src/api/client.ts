import createClient from "openapi-fetch";
import { REAL_API_BASE_URL } from "./config";
import type { paths } from "./generated/schema";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || REAL_API_BASE_URL;

const apiHeaders = new Headers();

export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  headers: apiHeaders,
  fetch: (...args) => globalThis.fetch(...args),
});

export function setApiAccessToken(token: string | undefined) {
  if (token) apiHeaders.set("Authorization", `Bearer ${token}`);
  else apiHeaders.delete("Authorization");
}
