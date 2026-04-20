"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { DataTableWrapper } from "@/components/tables/DataTableWrapper";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { FilterBar } from "@/components/filters/FilterBar";
import { AppModal } from "@/components/common/AppModal";
import { queryKeys } from "@/lib/api/query-keys";
import { createSite, deleteSite, getSites, updateSite } from "@/services/sites.service";
import type { Site } from "@/types/site";

export default function SitesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", location: "", description: "" });

  const sitesQuery = useQuery({
    queryKey: queryKeys.sites({ search }),
    queryFn: () => getSites({ page: 1, limit: 100, search }),
  });

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      toast.success("Site created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.sites() });
      setIsCreateOpen(false);
      setForm({ name: "", location: "", description: "" });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create site"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateSite(id, payload),
    onSuccess: () => {
      toast.success("Site updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.sites() });
      setEditSite(null);
      setForm({ name: "", location: "", description: "" });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update site"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: () => {
      toast.success("Site deleted/deactivated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.sites() });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to remove site"),
  });

  const sites = useMemo(() => sitesQuery.data?.data?.items || [], [sitesQuery.data]);

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(form);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!editSite) return;
    try {
      await updateMutation.mutateAsync({ id: editSite.id, payload: form });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageShell
      showBackButton
      backFallbackHref="/dashboard"
      title="Sites"
      description="Manage plant sites and operations"
      action={
        <button type="button" onClick={() => setIsCreateOpen(true)} className="rounded-md bg-black px-3 py-2 text-sm text-white">
          Create Site
        </button>
      }
    >
      <FilterBar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by site name or location"
          className="w-full min-w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </FilterBar>

      {sitesQuery.isLoading ? <LoadingState label="Loading sites..." /> : null}
      {sitesQuery.isError ? <ErrorState message={sitesQuery.error.message} /> : null}
      {!sitesQuery.isLoading && !sitesQuery.isError && !sites.length ? <EmptyState message="No sites found" /> : null}

      {!sitesQuery.isLoading && !sitesQuery.isError && sites.length ? (
        <DataTableWrapper>
          <table className="min-w-full">
            <thead className="bg-neutral-50 text-left text-neutral-700">
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Parameters</th>
                <th>Assignments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site: Site) => (
                <tr key={site.id} className="border-t border-neutral-200">
                  <td>{site.name}</td>
                  <td>{site.location}</td>
                  <td>{site.parameterCount ?? 0}</td>
                  <td>{site.assignmentCount ?? 0}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/sites/${site.id}`} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">
                        View
                      </Link>
                      <button
                        type="button"
                        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
                        onClick={() => {
                          setEditSite(site);
                          setForm({ name: site.name, location: site.location, description: site.description || "" });
                        }}
                      >
                        Edit
                      </button>
                      <ConfirmDialog
                        title="Delete or deactivate site"
                        description={`Are you sure you want to remove ${site.name}?`}
                        triggerLabel="Remove"
                        onConfirm={async () => {
                          await deleteMutation.mutateAsync(site.id);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableWrapper>
      ) : null}

      <AppModal title="Create Site" open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <div className="grid gap-3">
          <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Site name" className="rounded border border-neutral-300 px-3 py-2" />
          <input value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} placeholder="Location" className="rounded border border-neutral-300 px-3 py-2" />
          <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description" className="rounded border border-neutral-300 px-3 py-2" rows={3} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border border-neutral-300 px-3 py-1.5" onClick={() => setIsCreateOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-black px-3 py-1.5 text-white"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            Create
          </button>
        </div>
      </AppModal>

      <AppModal title="Edit Site" open={Boolean(editSite)} onClose={() => setEditSite(null)}>
        <div className="grid gap-3">
          <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Site name" className="rounded border border-neutral-300 px-3 py-2" />
          <input value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} placeholder="Location" className="rounded border border-neutral-300 px-3 py-2" />
          <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description" className="rounded border border-neutral-300 px-3 py-2" rows={3} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border border-neutral-300 px-3 py-1.5" onClick={() => setEditSite(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-black px-3 py-1.5 text-white"
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            Update
          </button>
        </div>
      </AppModal>
    </PageShell>
  );
}
