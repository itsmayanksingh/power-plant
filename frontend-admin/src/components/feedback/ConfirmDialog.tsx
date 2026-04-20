"use client";

import { useState } from "react";

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  triggerLabel,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">
        {triggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{description}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border border-neutral-300 px-3 py-1.5 text-sm" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-black px-3 py-1.5 text-sm text-white"
                onClick={async () => {
                  await onConfirm();
                  setOpen(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
