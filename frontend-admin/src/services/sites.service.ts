import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";

export async function getSites(params?: Record<string, unknown>) {
  try {
    const response = await api.get(endpoints.sites, { params });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getSiteById(id: string) {
  try {
    const response = await api.get(`${endpoints.sites}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function createSite(payload: Record<string, unknown>) {
  try {
    const response = await api.post(endpoints.sites, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function updateSite(id: string, payload: Record<string, unknown>) {
  try {
    const response = await api.put(`${endpoints.sites}/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function deleteSite(id: string) {
  try {
    const response = await api.delete(`${endpoints.sites}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function listAssignments(siteId: string) {
  try {
    const response = await api.get(`/api/v1/sites/${siteId}/assignments`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function assignEmployee(siteId: string, employeeId: string) {
  try {
    const response = await api.post(`/api/v1/sites/${siteId}/assign`, { employeeId });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function removeAssignment(siteId: string, userId: string) {
  try {
    const response = await api.delete(`/api/v1/sites/${siteId}/assign/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
