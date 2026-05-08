const ACCESS_TOKEN_KEY = "pm_access_token";
const REFRESH_TOKEN_KEY = "pm_refresh_token";
const IMPERSONATION_ORIGINAL_SESSION_KEY = "pm_impersonation_original_session";

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24}`;
}

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function getRefreshToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = "accessToken=; path=/; max-age=0";
}

export type OriginalSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "superadmin" | "admin" | "employee";
  };
};

export function saveOriginalSession(session: OriginalSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(IMPERSONATION_ORIGINAL_SESSION_KEY, JSON.stringify(session));
}

export function getOriginalSession(): OriginalSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(IMPERSONATION_ORIGINAL_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OriginalSession;
  } catch {
    return null;
  }
}

export function clearOriginalSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(IMPERSONATION_ORIGINAL_SESSION_KEY);
}
