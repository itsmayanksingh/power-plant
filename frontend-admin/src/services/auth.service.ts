import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { endpoints } from "@/lib/api/endpoints";

export type LoginPayload = { email: string; password: string };

export async function login(payload: LoginPayload) {
  try {
    const response = await api.post(endpoints.auth.login, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getMe() {
  try {
    const response = await api.get(endpoints.auth.me);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function logout(refreshToken: string) {
  try {
    const response = await api.post(endpoints.auth.logout, { refreshToken });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  try {
    const response = await api.post(endpoints.auth.changePassword, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
