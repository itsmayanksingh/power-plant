import axios, { AxiosError } from "axios";
import { endpoints } from "@/lib/api/endpoints";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "@/lib/auth/tokens";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${baseURL}${endpoints.auth.refresh}`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );
      const payload = refreshResponse.data?.data;
      setAuthTokens(payload.accessToken, payload.refreshToken);
      queue.forEach((cb) => cb(payload.accessToken));
      queue = [];

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
