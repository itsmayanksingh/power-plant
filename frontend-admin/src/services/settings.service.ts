import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";

export async function getSettings() {
  try {
    const response = await api.get(endpoints.settings);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function updateSettings(payload: Record<string, unknown>) {
  try {
    const response = await api.put(endpoints.settings, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
