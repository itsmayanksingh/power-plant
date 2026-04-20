"use client";

import { X } from "lucide-react";

export function AppModal({
  title,
  open,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <div className={`w-full ${maxWidth} rounded-xl border border-neutral-200 bg-white p-4 shadow-xl sm:p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md border border-neutral-300 p-1.5 hover:bg-neutral-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
