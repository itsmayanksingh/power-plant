"use client";

import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/store/ui.store";

export function DataTableWrapper({ children }: { children: React.ReactNode }) {
  const density = useUiStore((s) => s.tableDensity);

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm",
        density === "compact" && "[&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5 [&_td]:text-xs [&_th]:text-xs",
        density === "cozy" && "[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_td]:text-sm [&_th]:text-sm",
        density === "comfortable" && "[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_td]:text-sm [&_th]:text-sm",
      )}
    >
      {children}
    </div>
  );
}
