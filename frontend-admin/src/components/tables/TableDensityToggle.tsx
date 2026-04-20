"use client";

import { Gauge } from "lucide-react";
import { useUiStore } from "@/store/ui.store";

const labels: Record<"compact" | "cozy" | "comfortable", string> = {
  compact: "Compact",
  cozy: "Cozy",
  comfortable: "Comfort",
};

export function TableDensityToggle() {
  const tableDensity = useUiStore((s) => s.tableDensity);
  const cycleTableDensity = useUiStore((s) => s.cycleTableDensity);

  return (
    <button
      type="button"
      onClick={cycleTableDensity}
      className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm font-medium hover:bg-neutral-100"
      title="Toggle table density"
    >
      <Gauge className="h-4 w-4" />
      {labels[tableDensity]}
    </button>
  );
}
