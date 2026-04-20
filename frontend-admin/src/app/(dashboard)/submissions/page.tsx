"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { DataTableWrapper } from "@/components/tables/DataTableWrapper";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { queryKeys } from "@/lib/api/query-keys";
import { exportSubmissions, getMissingSubmissions, getSubmissionById, getSubmissions, updateSubmissionStatus } from "@/services/submissions.service";
import type { Submission } from "@/types/submission";

export default function SubmissionsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const submissionsQuery = useQuery({ queryKey: queryKeys.submissions({ status }), queryFn: () => getSubmissions({ status, page: 1, limit: 100 }) });
  const missingQuery = useQuery({ queryKey: queryKeys.missingSubmissions(), queryFn: () => getMissingSubmissions() });
  const detailQuery = useQuery({ queryKey: ["submission-detail", selectedId], queryFn: () => getSubmissionById(selectedId), enabled: Boolean(selectedId) });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: "approved" | "rejected" | "pending" }) => updateSubmissionStatus(id, nextStatus),
    onSuccess: () => {
      toast.success("Submission status updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update status"),
  });

  const handleExport = async () => {
    try {
      const blob = await exportSubmissions({ status });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submissions-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  };

  const submissions = submissionsQuery.data?.data?.items || [];

  return (
    <PageShell
      showBackButton
      backFallbackHref="/dashboard"
      title="Submissions"
      description="Monitor and review employee submissions"
      action={<button type="button" onClick={handleExport} className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100">Export CSV</button>}
    >
      <FilterBar>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-neutral-300 px-3 py-2 text-sm">
          <option value="">All status</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
      </FilterBar>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <strong>Missing Today:</strong> {missingQuery.data?.data?.length ?? 0}
      </section>

      {submissionsQuery.isLoading ? <LoadingState label="Loading submissions..." /> : null}
      {submissionsQuery.isError ? <ErrorState message={submissionsQuery.error.message} /> : null}
      {!submissionsQuery.isLoading && !submissionsQuery.isError && !submissions.length ? <EmptyState message="No submissions found" /> : null}

      {!submissionsQuery.isLoading && !submissionsQuery.isError && submissions.length ? (
        <DataTableWrapper>
          <table className="min-w-full">
            <thead className="bg-neutral-50 text-left text-neutral-700">
              <tr>
                <th>Date</th>
                <th>Site</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((row: Submission) => (
                <tr key={row.id} className="border-t border-neutral-200">
                  <td>{row.submission_date}</td>
                  <td>{row.site_name}</td>
                  <td>{row.submitter_name}</td>
                  <td>{row.status}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="rounded border border-neutral-300 px-2 py-1 text-xs" onClick={() => setSelectedId(row.id)}>View</button>
                      <button type="button" className="rounded border border-neutral-300 px-2 py-1 text-xs" onClick={() => statusMutation.mutate({ id: row.id, nextStatus: "approved" })}>Approve</button>
                      <button type="button" className="rounded border border-neutral-300 px-2 py-1 text-xs" onClick={() => statusMutation.mutate({ id: row.id, nextStatus: "rejected" })}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableWrapper>
      ) : null}

      {selectedId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30">
          <div className="h-full w-full max-w-xl overflow-y-auto border-l border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Submission Detail</h3>
              <button type="button" className="rounded border border-neutral-300 px-2 py-1 text-sm" onClick={() => setSelectedId("")}>Close</button>
            </div>
            {detailQuery.isLoading ? <LoadingState label="Loading detail..." /> : null}
            {detailQuery.isError ? <ErrorState message={detailQuery.error.message} /> : null}
            {detailQuery.data?.data ? (
              <div className="mt-3 space-y-3 text-sm">
                <p><strong>Site:</strong> {detailQuery.data.data.site_id}</p>
                <p><strong>Date:</strong> {detailQuery.data.data.submission_date}</p>
                <p><strong>Status:</strong> {detailQuery.data.data.status}</p>
                <p><strong>Notes:</strong> {detailQuery.data.data.notes || "-"}</p>
                <div>
                  <h4 className="font-semibold">Values</h4>
                  <ul className="mt-2 space-y-1">
                    {(detailQuery.data.data.values || []).map((v: { id: string; parameter_name: string; value_text: string; value_number: number }) => (
                      <li key={v.id} className="rounded border border-neutral-200 p-2">{v.parameter_name}: {v.value_text ?? v.value_number ?? "-"}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
