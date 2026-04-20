import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";
import { sanitizeQueryParams } from "@/lib/api/params";

export async function getSubmissions(params?: Record<string, unknown>) {
  try {
    const response = await api.get(endpoints.submissions, { params: sanitizeQueryParams(params) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "submissions.getSubmissions"));
  }
}

export async function getSubmissionById(id: string) {
  try {
    const response = await api.get(`${endpoints.submissions}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "submissions.getSubmissionById"));
  }
}

export async function getMissingSubmissions(date?: string) {
  try {
    const response = await api.get(`${endpoints.submissions}/missing`, { params: sanitizeQueryParams({ date }) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "submissions.getMissingSubmissions"));
  }
}

export async function updateSubmissionStatus(id: string, status: "pending" | "approved" | "rejected") {
  try {
    const response = await api.patch(`${endpoints.submissions}/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "submissions.updateSubmissionStatus"));
  }
}

export async function exportSubmissions(params?: Record<string, unknown>) {
  try {
    const response = await api.get(`${endpoints.submissions}/export`, { params: sanitizeQueryParams(params), responseType: "blob" });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "submissions.exportSubmissions"));
  }
}
