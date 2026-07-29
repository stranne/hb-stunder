import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../api/client";
import { todayInStockholm } from "../../features/schedule/model/scheduleDate";
import { stableMockInstructorName } from "../fixtures/mockNames";
import { scheduleForDate } from "../fixtures/schedule";

const businessUnitNames: Record<number, string> = {
  1: "Haga",
  4128: "Drottningtorget",
  3509: "Älvstranden",
};

export const scheduleHandlers = [
  http.get(`${API_BASE_URL}/businessunits/:businessUnit/groupactivities`, ({ request, params }) => {
    const start = new URL(request.url).searchParams.get("period.start");
    const date = start ? todayInStockholm(new Date(start)) : todayInStockholm();
    const businessUnitId = Number(params.businessUnit);
    return HttpResponse.json(
      scheduleForDate(date).map((activity) => ({
        ...activity,
        id: (activity.id ?? 0) + businessUnitId,
        businessUnit: {
          id: businessUnitId,
          name: businessUnitNames[businessUnitId] ?? "Hagabadet",
        },
      })),
    );
  }),
  http.get(`${API_BASE_URL}/services/groupactivityinstructors`, () =>
    HttpResponse.json(
      [21, 22, 23, 24, 25, 26, 27, 28].map((id) => ({
        id,
        name: stableMockInstructorName(id),
        type: "Employee",
      })),
    ),
  ),
  http.get(`${API_BASE_URL}/products/groupactivities`, () =>
    HttpResponse.json([
      { id: 204, name: "Boxing" },
      { id: 203, name: "Pilates" },
      { id: 202, name: "Strength" },
      { id: 201, name: "Yoga" },
    ]),
  ),
];
