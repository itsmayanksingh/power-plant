"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSpreadsheet, CalendarClock, ChartColumnIncreasing } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { getAttendanceReport, getParameterAnalysis, getSubmissionReport } from "@/services/reports.service";

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

type AnalysisRow = {
  parameter_id: string;
  parameter_name: string;
  type: string;
  total_entries: number;
  avg_numeric: number | null;
};

export default function ReportsPage() {
  const [siteId, setSiteId] = useState("");

  const submissions = useQuery({ queryKey: ["report-submissions", siteId], queryFn: () => getSubmissionReport({ siteId }) });
  const attendance = useQuery({ queryKey: ["report-attendance", siteId], queryFn: () => getAttendanceReport({ siteId }) });
  const analysis = useQuery({ queryKey: ["report-analysis", siteId], queryFn: () => getParameterAnalysis({ siteId }) });

  const submissionRows = useMemo(() => (submissions.data?.data || []) as Record<string, unknown>[], [submissions.data]);
  const attendanceRows = useMemo(() => (attendance.data?.data || []) as Record<string, unknown>[], [attendance.data]);
  const analysisRows = useMemo(() => (analysis.data?.data || []) as AnalysisRow[], [analysis.data]);

  const comparativeBars = useMemo(() => {
    const max = Math.max(submissionRows.length, attendanceRows.length, 1);
    return [
      {
        label: "Submissions",
        value: submissionRows.length,
        width: Math.max(8, Math.round((submissionRows.length / max) * 100)),
        color: "bg-sky-500",
      },
      {
        label: "Attendance",
        value: attendanceRows.length,
        width: Math.max(8, Math.round((attendanceRows.length / max) * 100)),
        color: "bg-emerald-500",
      },
    ];
  }, [submissionRows.length, attendanceRows.length]);

  const analysisBars = useMemo(() => {
    const top = analysisRows.slice(0, 8);
    const max = top.reduce((acc, row) => Math.max(acc, Number(row.total_entries || 0)), 0) || 1;
    return top.map((row, index) => ({
      ...row,
      width: Math.max(8, Math.round((Number(row.total_entries || 0) / max) * 100)),
      color: ["bg-violet-500", "bg-fuchsia-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-cyan-500", "bg-lime-500", "bg-orange-500"][index % 8],
    }));
  }, [analysisRows]);

  return (
    <PageShell showBackButton backFallbackHref="/dashboard" title="Reports" description="Operational exports and analytics">
      <FilterBar>
        <input
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          placeholder="Optional Site ID filter"
          className="w-full min-w-72 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </FilterBar>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Submission Rows",
            value: submissionRows.length,
            icon: FileSpreadsheet,
            color: "from-sky-500 to-cyan-500",
          },
          {
            label: "Attendance Rows",
            value: attendanceRows.length,
            icon: CalendarClock,
            color: "from-emerald-500 to-teal-500",
          },
          {
            label: "Analysis Params",
            value: analysisRows.length,
            icon: ChartColumnIncreasing,
            color: "from-violet-500 to-indigo-500",
          },
          {
            label: "Filtered Site",
            value: siteId ? 1 : 0,
            icon: FileSpreadsheet,
            color: "from-amber-500 to-orange-500",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.color}`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-600">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-black">{formatNumber(item.value)}</p>
                </div>
                <span className="rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-neutral-700">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Report Volume Graph</h3>
          {submissions.isLoading || attendance.isLoading ? <LoadingState label="Loading report graph..." /> : null}
          {submissions.isError ? <ErrorState message={submissions.error.message} /> : null}
          {attendance.isError ? <ErrorState message={attendance.error.message} /> : null}

          {!submissions.isLoading && !attendance.isLoading && !submissions.isError && !attendance.isError ? (
            <div className="mt-4 space-y-3">
              {comparativeBars.map((bar) => (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span>{bar.label}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-700">{formatNumber(bar.value)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-neutral-100">
                    <div className={`h-3 rounded-full ${bar.color}`} style={{ width: `${bar.width}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
              onClick={() => {
                if (!submissionRows.length) return toast.error("No submission rows");
                downloadCsv(submissionRows, `submissions-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
                toast.success("Submissions CSV exported");
              }}
            >
              Export Submissions CSV
            </button>
            <button
              type="button"
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              onClick={() => {
                if (!attendanceRows.length) return toast.error("No attendance rows");
                downloadCsv(attendanceRows, `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
                toast.success("Attendance CSV exported");
              }}
            >
              Export Attendance CSV
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Parameter Analysis Graph</h3>
          {analysis.isLoading ? <LoadingState label="Loading analysis..." /> : null}
          {analysis.isError ? <ErrorState message={analysis.error.message} /> : null}
          {!analysis.isLoading && !analysis.isError && !analysisBars.length ? <EmptyState message="No analysis data" /> : null}

          {!analysis.isLoading && !analysis.isError && analysisBars.length > 0 ? (
            <div className="mt-4 space-y-3">
              {analysisBars.map((item) => (
                <div key={item.parameter_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span className="font-medium text-neutral-700">{item.parameter_name}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-700">{formatNumber(Number(item.total_entries || 0))}</span>
                  </div>
                  <div className="h-3 rounded-full bg-neutral-100">
                    <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${item.width}%` }} />
                  </div>
                  <p className="text-[11px] text-neutral-500">Type: {item.type} | Avg: {item.avg_numeric ?? "-"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}

