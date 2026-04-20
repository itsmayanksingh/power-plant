"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";

export function ErrorLogView({ message, details }: { message: string; details?: string }) {
  const [open, setOpen] = useState(false);
  const timestamp = useMemo(() => format(new Date(), "yyyy-MM-dd HH:mm:ss"), []);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Request Failed</p>
          <p className="mt-1 text-sm">{message}</p>
          <p className="mt-1 text-xs text-red-700/80">{timestamp}</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium hover:bg-red-100"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide Log" : "View Log"}
        </button>
      </div>
      {open ? (
        <pre className="mt-3 max-h-52 overflow-auto rounded-md border border-red-200 bg-white p-3 text-xs text-red-700 whitespace-pre-wrap">
{details || message}
        </pre>
      ) : null}
    </div>
  );
}
