import createClient from "openapi-fetch";
import { REAL_API_BASE_URL } from "./config";
import type { paths } from "./generated/schema";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || REAL_API_BASE_URL;

export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});
