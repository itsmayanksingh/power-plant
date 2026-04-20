"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { StatusToggle } from "@/components/common/StatusToggle";
import { queryKeys } from "@/lib/api/query-keys";
import { getSiteById, listAssignments, assignEmployee, removeAssignment } from "@/services/sites.service";
import { createParameter, deleteParameter, getParameters, reorderParameters, toggleParameter, updateParameter } from "@/services/parameters.service";
import { getUsers } from "@/services/users.service";
import type { SiteParameter } from "@/types/site";

type ParametersEnvelope = {
  data?: SiteParameter[];
};

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const siteId = params.id;
  const queryClient = useQueryClient();

  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [parameterForm, setParameterForm] = useState({ name: "", type: "text", isRequired: true, options: "", minValue: "", maxValue: "", unit: "" });
  const [editingParameter, setEditingParameter] = useState<SiteParameter | null>(null);

  const siteQuery = useQuery({ queryKey: queryKeys.site(siteId), queryFn: () => getSiteById(siteId), enabled: Boolean(siteId) });
  const parametersKey = queryKeys.parameters(siteId);
  const parametersQuery = useQuery({ queryKey: parametersKey, queryFn: () => getParameters(siteId), enabled: Boolean(siteId) });
  const assignmentsQuery = useQuery({ queryKey: queryKeys.assignments(siteId), queryFn: () => listAssignments(siteId), enabled: Boolean(siteId) });
  const employeesQuery = useQuery({ queryKey: queryKeys.users({ role: "employee" }), queryFn: () => getUsers({ role: "employee", page: 1, limit: 200 }) });

  const assignMutation = useMutation({
    mutationFn: (employeeId: string) => assignEmployee(siteId, employeeId),
    onSuccess: () => {
      toast.success("Employee assigned successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments(siteId) });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to assign employee"),
  });

  const removeAssignMutation = useMutation({
    mutationFn: (userId: string) => removeAssignment(siteId, userId),
    onSuccess: () => {
      toast.success("Assignment removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments(siteId) });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to remove assignment"),
  });

  const parameterMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: parameterForm.name,
        type: parameterForm.type,
        isRequired: parameterForm.isRequired,
        unit: parameterForm.unit || undefined,
      };

      if (parameterForm.type === "dropdown") {
        payload.options = parameterForm.options.split(",").map((v) => v.trim()).filter(Boolean);
      }
      if (parameterForm.type === "number") {
        payload.minValue = parameterForm.minValue ? Number(parameterForm.minValue) : undefined;
        payload.maxValue = parameterForm.maxValue ? Number(parameterForm.maxValue) : undefined;
      }

      if (editingParameter) {
        return updateParameter(editingParameter.id, payload);
      }
      return createParameter(siteId, payload);
    },
    onSuccess: () => {
      toast.success(editingParameter ? "Parameter updated" : "Parameter created");
      queryClient.invalidateQueries({ queryKey: parametersKey });
      setEditingParameter(null);
      setParameterForm({ name: "", type: "text", isRequired: true, options: "", minValue: "", maxValue: "", unit: "" });
    },
    onError: (error: Error) => toast.error(error.message || "Parameter action failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => toggleParameter(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: parametersKey });
      const previous = queryClient.getQueryData<ParametersEnvelope>(parametersKey);
      queryClient.setQueryData<ParametersEnvelope>(parametersKey, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)),
        };
      });
      return { previous };
    },
    onSuccess: (_res, vars) => {
      const current = queryClient.getQueryData<ParametersEnvelope>(parametersKey);
      const toggled = current?.data?.find((p) => p.id === vars.id);
      toast.success(toggled?.is_active ? "Parameter activated via toggle" : "Parameter deactivated via toggle");
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(parametersKey, context.previous);
      }
      toast.error(error.message || "Failed to toggle parameter");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: parametersKey });
    },
  });

  const deleteParamMutation = useMutation({
    mutationFn: deleteParameter,
    onSuccess: () => {
      toast.success("Parameter deleted/deactivated");
      queryClient.invalidateQueries({ queryKey: parametersKey });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete parameter"),
  });

  const reorderMutation = useMutation({
    mutationFn: (orders: Array<{ id: string; displayOrder: number }>) => reorderParameters(siteId, orders),
    onSuccess: () => {
      toast.success("Parameters reordered");
      queryClient.invalidateQueries({ queryKey: parametersKey });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to reorder"),
  });

  const parameters = useMemo(() => parametersQuery.data?.data || [], [parametersQuery.data]);
  const assignments = assignmentsQuery.data?.data || [];
  const employees = employeesQuery.data?.data?.items || [];

  if (siteQuery.isLoading) return <LoadingState label="Loading site..." />;
  if (siteQuery.isError) return <ErrorState message={siteQuery.error.message} />;

  const site = siteQuery.data?.data;

  return (
    <PageShell showBackButton backFallbackHref="/sites" title={`Site: ${site.name}`} description={site.location}>
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Site Details</h3>
        <p className="mt-2 text-sm text-neutral-700">{site.description || "No description"}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="text-lg font-semibold">Employee Assignments</h3>
          <div className="mt-3 flex gap-2">
            <select className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm" value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)}>
              <option value="">Select employee</option>
              {employees.map((e: { id: string; name: string; email: string }) => (
                <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
              ))}
            </select>
            <button
              type="button"
              className="rounded bg-black px-3 py-2 text-sm text-white"
              onClick={async () => {
                if (!newEmployeeId) return;
                try {
                  await assignMutation.mutateAsync(newEmployeeId);
                  setNewEmployeeId("");
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              Assign
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {assignments.map((a: { id: string; employee_id: string; name: string; email: string }) => (
              <li key={a.id} className="flex items-center justify-between rounded border border-neutral-200 p-2">
                <span>{a.name} ({a.email})</span>
                <ConfirmDialog
                  title="Remove assignment"
                  description={`Remove ${a.name} from this site?`}
                  triggerLabel="Remove"
                  onConfirm={async () => {
                    await removeAssignMutation.mutateAsync(a.employee_id);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="text-lg font-semibold">Parameter Builder</h3>
          <div className="mt-3 grid gap-2">
            <input value={parameterForm.name} onChange={(e) => setParameterForm((s) => ({ ...s, name: e.target.value }))} placeholder="Parameter name" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
            <select value={parameterForm.type} onChange={(e) => setParameterForm((s) => ({ ...s, type: e.target.value }))} className="rounded border border-neutral-300 px-3 py-2 text-sm">
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="dropdown">dropdown</option>
              <option value="boolean">boolean</option>
              <option value="date">date</option>
            </select>
            {parameterForm.type === "dropdown" ? (
              <input value={parameterForm.options} onChange={(e) => setParameterForm((s) => ({ ...s, options: e.target.value }))} placeholder="Options (comma separated)" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
            ) : null}
            {parameterForm.type === "number" ? (
              <div className="grid grid-cols-2 gap-2">
                <input value={parameterForm.minValue} onChange={(e) => setParameterForm((s) => ({ ...s, minValue: e.target.value }))} placeholder="Min" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
                <input value={parameterForm.maxValue} onChange={(e) => setParameterForm((s) => ({ ...s, maxValue: e.target.value }))} placeholder="Max" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
              </div>
            ) : null}
            <input value={parameterForm.unit} onChange={(e) => setParameterForm((s) => ({ ...s, unit: e.target.value }))} placeholder="Unit" className="rounded border border-neutral-300 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={parameterForm.isRequired} onChange={(e) => setParameterForm((s) => ({ ...s, isRequired: e.target.checked }))} /> Required
            </label>
            <button
              type="button"
              className="rounded bg-black px-3 py-2 text-sm text-white"
              onClick={async () => {
                try {
                  await parameterMutation.mutateAsync();
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              {editingParameter ? "Update Parameter" : "Add Parameter"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Parameters</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {parameters.map((p: SiteParameter, index: number) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 p-2">
              <span>{p.name} ({p.type})</span>
              <div className="flex flex-wrap items-center gap-2">
                <StatusToggle
                  checked={Boolean(p.is_active)}
                  onChange={() => toggleMutation.mutate({ id: p.id })}
                  disabled={toggleMutation.isPending}
                  activeLabel="Active"
                  inactiveLabel="Inactive"
                />
                <button
                  type="button"
                  className="rounded border border-neutral-300 px-2 py-1 text-xs"
                  onClick={() => {
                    setEditingParameter(p);
                    setParameterForm({
                      name: p.name,
                      type: p.type,
                      isRequired: p.is_required,
                      options: Array.isArray(p.options) ? p.options.join(",") : "",
                      minValue: p.min_value ? String(p.min_value) : "",
                      maxValue: p.max_value ? String(p.max_value) : "",
                      unit: p.unit || "",
                    });
                  }}
                >
                  Edit
                </button>
                <ConfirmDialog
                  title="Delete parameter"
                  description={`Delete ${p.name}?`}
                  triggerLabel="Delete"
                  onConfirm={async () => {
                    await deleteParamMutation.mutateAsync(p.id);
                  }}
                />
                {index > 0 ? (
                  <button
                    type="button"
                    className="rounded border border-neutral-300 px-2 py-1 text-xs"
                    onClick={() => {
                      const swapped = [...parameters];
                      [swapped[index - 1], swapped[index]] = [swapped[index], swapped[index - 1]];
                      const orders = swapped.map((item, idx) => ({ id: item.id, displayOrder: idx }));
                      reorderMutation.mutate(orders);
                    }}
                  >
                    Up
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
