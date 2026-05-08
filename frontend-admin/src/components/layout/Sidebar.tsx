"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Factory, ClipboardCheck, CalendarCheck, FileSpreadsheet, Settings, Leaf } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/sites", label: "Sites", icon: Factory },
  { href: "/submissions", label: "Submissions", icon: ClipboardCheck },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  mobileOpen,
  collapsed,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Close sidebar" onClick={onCloseMobile} className="fixed inset-0 z-30 bg-black/35 lg:hidden" /> : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-neutral-200 bg-white transition-all duration-200 lg:sticky lg:z-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-20" : "w-72",
        )}
      >
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-blue-50 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-black p-2 text-white">
                <Leaf className="h-4 w-4" />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Admin Panel</p>
                  <h1 className="text-sm font-bold text-black">Plant Monitoring</h1>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "border border-blue-200 bg-blue-50 text-black shadow-sm"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-black",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
