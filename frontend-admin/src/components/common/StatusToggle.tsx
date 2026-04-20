"use client";

import { cn } from "@/lib/utils/cn";

export function StatusToggle({
  checked,
  onChange,
  disabled,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium transition",
        checked ? "border-green-300 bg-green-50 text-green-700" : "border-neutral-300 bg-neutral-100 text-neutral-600",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "h-4 w-7 rounded-full p-0.5 transition",
          checked ? "bg-green-500" : "bg-neutral-400",
        )}
      >
        <span
          className={cn(
            "block h-3 w-3 rounded-full bg-white transition",
            checked ? "translate-x-3" : "translate-x-0",
          )}
        />
      </span>
      {checked ? activeLabel : inactiveLabel}
    </button>
  );
}
