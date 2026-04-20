"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { DataTableWrapper } from "@/components/tables/DataTableWrapper";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { queryKeys } from "@/lib/api/query-keys";
import { getAttendance, getAttendanceSummary } from "@/services/attendance.service";
import type { Attendance } from "@/types/attendance";

export default function AttendancePage() {
  const [date, setDate] = useState("");

  const attendanceQuery = useQuery({ queryKey: queryKeys.attendance({ date }), queryFn: () => getAttendance({ date, page: 1, limit: 100 }) });
  const summaryQuery = useQuery({ queryKey: queryKeys.attendanceSummary({ date }), queryFn: () => getAttendanceSummary({ date }) });

  const rows = attendanceQuery.data?.data?.items || [];
  const summary = summaryQuery.data?.data || { total: 0, present: 0, late: 0, absent: 0 };

  return (
    <PageShell showBackButton backFallbackHref="/dashboard" title="Attendance" description="Track attendance records and summary">
      <FilterBar>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-neutral-300 px-3 py-2 text-sm" />
      </FilterBar>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total", value: summary.total || 0 },
          { label: "Present", value: summary.present || 0 },
          { label: "Late", value: summary.late || 0 },
          { label: "Absent", value: summary.absent || 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-600">{item.label}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>

      {attendanceQuery.isLoading ? <LoadingState label="Loading attendance..." /> : null}
      {attendanceQuery.isError ? <ErrorState message={attendanceQuery.error.message} /> : null}
      {!attendanceQuery.isLoading && !attendanceQuery.isError && !rows.length ? <EmptyState message="No attendance records" /> : null}

      {!attendanceQuery.isLoading && !attendanceQuery.isError && rows.length ? (
        <DataTableWrapper>
          <table className="min-w-full">
            <thead className="bg-neutral-50 text-left text-neutral-700">
              <tr>
                <th>Employee</th>
                <th>Site</th>
                <th>Date</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: Attendance) => (
                <tr key={row.id} className="border-t border-neutral-200">
                  <td>{row.user_name}</td>
                  <td>{row.site_name}</td>
                  <td>{row.attendance_date}</td>
                  <td>{row.check_in}</td>
                  <td>{row.check_out || "-"}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableWrapper>
      ) : null}
    </PageShell>
  );
}
