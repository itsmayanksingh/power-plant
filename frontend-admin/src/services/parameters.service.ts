import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";

export async function getParameters(siteId: string) {
  try {
    const response = await api.get(`/api/v1/sites/${siteId}/parameters`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function createParameter(siteId: string, payload: Record<string, unknown>) {
  try {
    const response = await api.post(`/api/v1/sites/${siteId}/parameters`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function updateParameter(id: string, payload: Record<string, unknown>) {
  try {
    const response = await api.put(`/api/v1/parameters/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function toggleParameter(id: string) {
  try {
    const response = await api.patch(`/api/v1/parameters/${id}/toggle`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function deleteParameter(id: string) {
  try {
    const response = await api.delete(`/api/v1/parameters/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function reorderParameters(siteId: string, orders: Array<{ id: string; displayOrder: number }>) {
  try {
    const response = await api.put(`/api/v1/sites/${siteId}/parameters/reorder`, { orders });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
