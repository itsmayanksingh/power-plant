import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";
import { sanitizeQueryParams } from "@/lib/api/params";

export async function getAttendance(params?: Record<string, unknown>) {
  try {
    const response = await api.get(endpoints.attendance, { params: sanitizeQueryParams(params) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "attendance.getAttendance"));
  }
}

export async function getAttendanceSummary(params?: Record<string, unknown>) {
  try {
    const response = await api.get(`${endpoints.attendance}/summary`, { params: sanitizeQueryParams(params) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "attendance.getAttendanceSummary"));
  }
}
