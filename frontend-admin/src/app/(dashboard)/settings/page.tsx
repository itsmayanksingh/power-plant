"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { queryKeys } from "@/lib/api/query-keys";
import { changePassword } from "@/services/auth.service";
import { getSettings, updateSettings } from "@/services/settings.service";

type SettingsFormValues = {
  attendanceCutoffHour: number;
  submissionCutoffHour: number;
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const form = useForm<SettingsFormValues>({ defaultValues: { attendanceCutoffHour: 9, submissionCutoffHour: 18 } });
  const passwordForm = useForm<{ currentPassword: string; newPassword: string }>({ defaultValues: { currentPassword: "", newPassword: "" } });

  const settingsQuery = useQuery({ queryKey: queryKeys.settings, queryFn: getSettings });

  useEffect(() => {
    if (settingsQuery.data?.data) {
      form.reset({
        attendanceCutoffHour: settingsQuery.data.data["attendance.cutoff_hour"]?.hour ?? 9,
        submissionCutoffHour: settingsQuery.data.data["submissions.daily_cutoff"]?.hour ?? 18,
      });
    }
  }, [settingsQuery.data, form]);

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update settings"),
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully");
      passwordForm.reset();
    },
    onError: (error: Error) => toast.error(error.message || "Password change failed"),
  });

  return (
    <PageShell showBackButton backFallbackHref="/dashboard" title="Settings" description="System configuration and security settings">
      {settingsQuery.isLoading ? <LoadingState label="Loading settings..." /> : null}
      {settingsQuery.isError ? <ErrorState message={settingsQuery.error.message} /> : null}

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Operational Rules</h3>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await settingsMutation.mutateAsync({
                "attendance.cutoff_hour": { hour: Number(values.attendanceCutoffHour) },
                "submissions.daily_cutoff": { hour: Number(values.submissionCutoffHour) },
              });
            } catch (error) {
              console.error(error);
            }
          })}
        >
          <input type="number" {...form.register("attendanceCutoffHour", { valueAsNumber: true })} className="rounded border border-neutral-300 px-3 py-2" placeholder="Attendance cutoff hour" />
          <input type="number" {...form.register("submissionCutoffHour", { valueAsNumber: true })} className="rounded border border-neutral-300 px-3 py-2" placeholder="Submission cutoff hour" />
          <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white sm:col-span-2">Save Settings</button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Change Password</h3>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            try {
              await passwordMutation.mutateAsync(values);
            } catch (error) {
              console.error(error);
            }
          })}
        >
          <input type="password" {...passwordForm.register("currentPassword")} className="rounded border border-neutral-300 px-3 py-2" placeholder="Current password" />
          <input type="password" {...passwordForm.register("newPassword")} className="rounded border border-neutral-300 px-3 py-2" placeholder="New password" />
          <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white sm:col-span-2">Change Password</button>
        </form>
      </section>
    </PageShell>
  );
}

