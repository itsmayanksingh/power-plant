"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ErrorLogsDrawer } from "@/components/layout/ErrorLogsDrawer";
import { useUiStore } from "@/store/ui.store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const openSidebar = useUiStore((s) => s.openSidebar);
  const closeSidebar = useUiStore((s) => s.closeSidebar);
  const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const openLogs = useUiStore((s) => s.openLogs);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 text-black">
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={sidebarOpen} collapsed={sidebarCollapsed} onCloseMobile={closeSidebar} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            onOpenSidebar={openSidebar}
            onToggleSidebar={toggleSidebarCollapsed}
            sidebarCollapsed={sidebarCollapsed}
            onOpenLogs={openLogs}
          />
          <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
      <ErrorLogsDrawer />
    </div>
  );
}
