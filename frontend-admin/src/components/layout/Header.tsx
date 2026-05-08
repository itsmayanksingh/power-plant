"use client";

import { useSyncExternalStore } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, Bug, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getOriginalSession, getRefreshToken, clearOriginalSession } from "@/lib/auth/tokens";
import { readAccessTokenPayload } from "@/lib/auth/jwt-payload";
import { logout } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { TableDensityToggle } from "@/components/tables/TableDensityToggle";

export function Header({
  onOpenSidebar,
  onToggleSidebar,
  sidebarCollapsed,
  onOpenLogs,
}: {
  onOpenSidebar: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onOpenLogs: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.logout);
  const setSession = useAuthStore((s) => s.setSession);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const payload = mounted ? readAccessTokenPayload() : null;
  const role = mounted ? (user?.role ?? payload?.role) : undefined;
  const displayName = mounted ? (user?.name || "User") : "User";
  const isImpersonating = mounted && Boolean(getOriginalSession());

  const handleLogout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logout(refreshToken);
      }
      clear();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      clear();
      toast.error(error instanceof Error ? error.message : "Logout failed");
      router.push("/login");
    }
  };

  const handleReturnToSuperadmin = () => {
    const original = getOriginalSession();
    if (!original) {
      toast.error("Original superadmin session not found");
      return;
    }
    setSession({
      accessToken: original.accessToken,
      refreshToken: original.refreshToken,
      user: {
        ...original.user,
        isActive: true,
      },
    });
    clearOriginalSession();
    toast.success("Returned to superadmin session");
    router.push("/dashboard");
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpenSidebar} className="rounded-md border border-neutral-300 p-2 lg:hidden hover:bg-neutral-100">
          <Menu className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggleSidebar} className="hidden rounded-md border border-neutral-300 p-2 lg:inline-flex hover:bg-neutral-100">
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Welcome</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-neutral-800">{displayName}</p>
            <span suppressHydrationWarning className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Logged in as: {role === "superadmin" ? "Superadmin" : role === "admin" ? "Admin" : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TableDensityToggle />
        <button
          type="button"
          onClick={onOpenLogs}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm font-medium hover:bg-neutral-100"
        >
          <Bug className="h-4 w-4" />
          Logs
        </button>
        {isImpersonating ? (
          <button
            type="button"
            onClick={handleReturnToSuperadmin}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <Undo2 className="h-4 w-4" />
            Return to Superadmin Dashboard
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-black hover:bg-neutral-100"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
