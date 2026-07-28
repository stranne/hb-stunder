import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../api/client";
import { todayInStockholm } from "../../features/schedule/model/scheduleDate";
import { scheduleForDate } from "../fixtures/schedule";

export const scheduleHandlers = [
  http.get(`${API_BASE_URL}/businessunits/:businessUnit/groupactivities`, ({ request }) => {
    const start = new URL(request.url).searchParams.get("period.start");
    const date = start ? todayInStockholm(new Date(start)) : todayInStockholm();
    return HttpResponse.json(scheduleForDate(date));
  }),
];
