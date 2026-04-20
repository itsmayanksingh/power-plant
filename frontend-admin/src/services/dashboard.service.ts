import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";

export async function getDashboardStats() {
  try {
    const response = await api.get(`${endpoints.dashboard}/stats`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getRecentSubmissions() {
  try {
    const response = await api.get(`${endpoints.dashboard}/recent-submissions`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getAttendanceToday() {
  try {
    const response = await api.get(`${endpoints.dashboard}/attendance-today`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getMissingToday() {
  try {
    const response = await api.get(`${endpoints.dashboard}/missing-today`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getSiteWiseStats() {
  try {
    const response = await api.get(`${endpoints.dashboard}/site-wise-stats`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
