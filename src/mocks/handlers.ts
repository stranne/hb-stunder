import type { RequestHandler } from "msw";
import { scheduleHandlers } from "./handlers/schedule";

export const handlers: RequestHandler[] = [...scheduleHandlers];
