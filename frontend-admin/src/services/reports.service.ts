import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";
import { sanitizeQueryParams } from "@/lib/api/params";

export async function getSubmissionReport(params?: Record<string, unknown>) {
  try {
    const response = await api.get(`${endpoints.reports}/submissions`, { params: sanitizeQueryParams(params) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "reports.getSubmissionReport"));
  }
}

export async function getAttendanceReport(params?: Record<string, unknown>) {
  try {
    const response = await api.get(`${endpoints.reports}/attendance`, { params: sanitizeQueryParams(params) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "reports.getAttendanceReport"));
  }
}

export async function getParameterAnalysis(params?: Record<string, unknown>) {
  try {
    const response = await api.get(`${endpoints.reports}/parameter-analysis`, { params: sanitizeQueryParams(params) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "reports.getParameterAnalysis"));
  }
}
