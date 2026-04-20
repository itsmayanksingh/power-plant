"use client";

import { format } from "date-fns";
import { useUiStore } from "@/store/ui.store";

export function ErrorLogsDrawer() {
  const logsOpen = useUiStore((s) => s.logsOpen);
  const errorLogs = useUiStore((s) => s.errorLogs);
  const closeLogs = useUiStore((s) => s.closeLogs);
  const clearErrorLogs = useUiStore((s) => s.clearErrorLogs);

  if (!logsOpen) return null;

  return (
    <>
      <button type="button" aria-label="Close logs" onClick={closeLogs} className="fixed inset-0 z-40 bg-black/30" />
      <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl border-l border-neutral-200 bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Error Logs</h3>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100" onClick={clearErrorLogs}>
              Clear
            </button>
            <button type="button" className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100" onClick={closeLogs}>
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto h-[calc(100vh-7rem)] pr-1">
          {errorLogs.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">No errors logged.</div>
          ) : (
            errorLogs.map((log) => (
              <article key={log.id} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                <p className="font-semibold text-red-800">{log.message}</p>
                <p className="mt-1 text-xs text-red-700">{log.source || "unknown-source"}</p>
                <p className="mt-1 text-xs text-red-700/80">{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}</p>
                {log.details ? <pre className="mt-2 whitespace-pre-wrap rounded border border-red-200 bg-white p-2 text-xs text-red-700">{log.details}</pre> : null}
              </article>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
