"use client";

import { create } from "zustand";

type UiErrorLog = {
  id: string;
  message: string;
  source?: string;
  timestamp: string;
  details?: string;
};

type TableDensity = "compact" | "cozy" | "comfortable";

type UiState = {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  logsOpen: boolean;
  tableDensity: TableDensity;
  errorLogs: UiErrorLog[];
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  openLogs: () => void;
  closeLogs: () => void;
  cycleTableDensity: () => void;
  addErrorLog: (entry: Omit<UiErrorLog, "id" | "timestamp">) => void;
  clearErrorLogs: () => void;
};

const nextDensity: Record<TableDensity, TableDensity> = {
  compact: "cozy",
  cozy: "comfortable",
  comfortable: "compact",
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  logsOpen: false,
  tableDensity: "cozy",
  errorLogs: [],
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openLogs: () => set({ logsOpen: true }),
  closeLogs: () => set({ logsOpen: false }),
  cycleTableDensity: () => set((state) => ({ tableDensity: nextDensity[state.tableDensity] })),
  addErrorLog: (entry) =>
    set((state) => ({
      errorLogs: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          ...entry,
        },
        ...state.errorLogs,
      ].slice(0, 100),
    })),
  clearErrorLogs: () => set({ errorLogs: [] }),
}));
