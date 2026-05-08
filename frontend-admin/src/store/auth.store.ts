"use client";

import { create } from "zustand";
import { AuthSession, User } from "@/types/user";
import { clearAuthTokens, clearOriginalSession, setAuthTokens } from "@/lib/auth/tokens";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (session) => {
    setAuthTokens(session.accessToken, session.refreshToken);
    set({ user: session.user, isAuthenticated: true });
  },
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    clearAuthTokens();
    clearOriginalSession();
    set({ user: null, isAuthenticated: false });
  },
}));
