import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";

export async function getUsers(params?: Record<string, unknown>) {
  try {
    const response = await api.get(endpoints.users, { params });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getUserById(id: string) {
  try {
    const response = await api.get(`${endpoints.users}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function createUser(payload: Record<string, unknown>) {
  try {
    const response = await api.post(endpoints.users, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function updateUser(id: string, payload: Record<string, unknown>) {
  try {
    const response = await api.put(`${endpoints.users}/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function activateUser(id: string) {
  try {
    const response = await api.patch(`${endpoints.users}/${id}/activate`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function deactivateUser(id: string) {
  try {
    const response = await api.patch(`${endpoints.users}/${id}/deactivate`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
