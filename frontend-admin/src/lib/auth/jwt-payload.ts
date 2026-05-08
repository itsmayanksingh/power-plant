import { getAccessToken } from "@/lib/auth/tokens";

export type AccessTokenPayload = {
  id?: string;
  role?: "superadmin" | "admin" | "employee";
  email?: string;
  exp?: number;
  impersonatedBy?: string;
};

export function readAccessTokenPayload(): AccessTokenPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}
