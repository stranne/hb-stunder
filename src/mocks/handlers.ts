import type { RequestHandler } from "msw";
import { bookingHandlers } from "./handlers/bookings";
import { scheduleHandlers } from "./handlers/schedule";

export const handlers: RequestHandler[] = [...scheduleHandlers, ...bookingHandlers];
