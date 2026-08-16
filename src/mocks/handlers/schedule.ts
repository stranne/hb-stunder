import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../api/client";
import { todayInStockholm } from "../../features/schedule/model/scheduleDate";
import { mockActivityProducts, mockInstructors, scheduleForDate } from "../fixtures/schedule";

export const scheduleHandlers = [
  http.get(`${API_BASE_URL}/businessunits/:businessUnit/groupactivities`, ({ request, params }) => {
    const start = new URL(request.url).searchParams.get("period.start");
    const date = start ? todayInStockholm(new Date(start)) : todayInStockholm();
    const businessUnitId = Number(params.businessUnit);
    return HttpResponse.json(scheduleForDate(date, businessUnitId));
  }),
  http.get(
    `${API_BASE_URL}/businessunits/:businessUnit/groupactivities/:activityId`,
    ({ params }) => {
      const activityId = Number(params.activityId);
      const day = Math.floor(activityId / 10_000);
      const date = new Date(day * 86_400_000).toISOString().slice(0, 10);
      const activity = scheduleForDate(date, Number(params.businessUnit)).find(
        ({ id }) => id === activityId,
      );

      return activity
        ? HttpResponse.json(activity)
        : HttpResponse.json({ message: "Not found" }, { status: 404 });
    },
  ),
  http.get(`${API_BASE_URL}/services/groupactivityinstructors`, () =>
    HttpResponse.json(mockInstructors),
  ),
  http.get(`${API_BASE_URL}/products/groupactivities`, () =>
    HttpResponse.json(mockActivityProducts),
  ),
];
