"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Factory, CalendarCheck2, ClipboardList, MessageSquareText, BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { queryKeys } from "@/lib/api/query-keys";
import { getAttendanceToday, getDashboardStats, getMissingToday, getRecentSubmissions, getSiteWiseStats } from "@/services/dashboard.service";

const SiteSubmissionsBarChart = dynamic(
  () => import("@/components/charts/SiteSubmissionsBarChart").then((m) => m.SiteSubmissionsBarChart),
  { ssr: false },
);
const SubmissionStatusPieChart = dynamic(
  () => import("@/components/charts/SubmissionStatusPieChart").then((m) => m.SubmissionStatusPieChart),
  { ssr: false },
);

type SiteWiseRow = { id: string; name: string; submissions: number };

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  time: string;
  mine?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export default function DashboardPage() {
  const stats = useQuery({ queryKey: queryKeys.dashboardStats, queryFn: getDashboardStats });
  const recent = useQuery({ queryKey: queryKeys.recentSubmissions, queryFn: getRecentSubmissions });
  const attendanceToday = useQuery({ queryKey: queryKeys.attendanceToday, queryFn: getAttendanceToday });
  const missing = useQuery({ queryKey: queryKeys.missingToday, queryFn: getMissingToday });
  const siteWise = useQuery({ queryKey: queryKeys.siteWiseStats, queryFn: getSiteWiseStats });

  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", author: "Ops Lead", text: "Morning team. Watch missing submissions by 6 PM.", time: "09:30" },
    { id: "m2", author: "Admin", text: "Noted. Site Delhi Plant already informed.", time: "09:42", mine: true },
  ]);

  const cards = stats.data?.data || {};

  const siteChartRows = useMemo(() => {
    const rows = (siteWise.data?.data || []) as SiteWiseRow[];
    return rows.map((row) => ({
      name: row.name,
      value: Number(row.submissions || 0),
    }));
  }, [siteWise.data]);

  const submissionStatusData = useMemo(() => {
    const rows = (recent.data?.data || []) as Array<{ status: string }>;
    const bucket: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const row of rows) {
      const key = (row.status || "pending").toLowerCase();
      if (key in bucket) bucket[key] += 1;
    }
    return [
      { name: "Pending", value: bucket.pending, color: "#f59e0b" },
      { name: "Approved", value: bucket.approved, color: "#22c55e" },
      { name: "Rejected", value: bucket.rejected, color: "#ef4444" },
    ];
  }, [recent.data]);

  if (stats.isLoading) return <LoadingState label="Loading dashboard..." />;
  if (stats.isError) return <ErrorState message={stats.error.message} />;

  const sendMessage = () => {
    const text = draftMessage.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, author: "Admin", text, time, mine: true },
    ]);
    setDraftMessage("");
  };

  const kpis = [
    {
      label: "Users",
      value: Number(cards.users ?? 0),
      icon: Users,
      color: "from-sky-500 to-cyan-500",
      chip: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      label: "Active Sites",
      value: Number(cards.activeSites ?? 0),
      icon: Factory,
      color: "from-emerald-500 to-teal-500",
      chip: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Attendance Today",
      value: Number(cards.attendanceToday ?? 0),
      icon: CalendarCheck2,
      color: "from-violet-500 to-indigo-500",
      chip: "text-violet-700 bg-violet-50 border-violet-200",
    },
    {
      label: "Submissions Today",
      value: Number(cards.submissionsToday ?? 0),
      icon: ClipboardList,
      color: "from-amber-500 to-orange-500",
      chip: "text-amber-700 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <PageShell title="Dashboard" description="Operational overview and quick status">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.color}`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-black">{formatNumber(item.value)}</p>
                </div>
                <span className={`rounded-lg border px-2 py-1 ${item.chip}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Recent Submissions</h3>
          {recent.isLoading ? <LoadingState /> : null}
          {recent.isError ? <ErrorState message={recent.error.message} /> : null}
          {!recent.isLoading && !recent.isError && (recent.data?.data?.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {recent.data.data.map((row: { id: string; employee_name: string; site_name: string; status: string; submission_date: string }) => (
                <li key={row.id} className="rounded-lg border border-neutral-200 p-2.5">
                  <p className="font-semibold text-neutral-800">{row.employee_name} - {row.site_name}</p>
                  <p className="mt-1 text-neutral-600">{row.submission_date}</p>
                  <span className="mt-1 inline-block rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : <EmptyState message="No recent submissions." />)}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Missing Submissions Today</h3>
          {missing.isLoading ? <LoadingState /> : null}
          {missing.isError ? <ErrorState message={missing.error.message} /> : null}
          {!missing.isLoading && !missing.isError && (missing.data?.data?.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {missing.data.data.slice(0, 8).map((row: { employee_id: string; employee_name: string; site_name: string }) => (
                <li key={row.employee_id + row.site_name} className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-800">
                  {row.employee_name} - {row.site_name}
                </li>
              ))}
            </ul>
          ) : <EmptyState message="No missing submissions." />)}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Attendance Today</h3>
          {attendanceToday.isLoading ? <LoadingState /> : null}
          {attendanceToday.isError ? <ErrorState message={attendanceToday.error.message} /> : null}
          {!attendanceToday.isLoading && !attendanceToday.isError && (
            attendanceToday.data?.data?.length ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-xs text-emerald-700">Records</p>
                  <p className="text-2xl font-bold text-emerald-800">{formatNumber(attendanceToday.data.data.length)}</p>
                </div>
              </div>
            ) : <EmptyState message="No attendance records today." />
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Site-wise Stats</h3>
          {siteWise.isLoading ? <LoadingState /> : null}
          {siteWise.isError ? <ErrorState message={siteWise.error.message} /> : null}
          {!siteWise.isLoading && !siteWise.isError && (siteWise.data?.data?.length ? (
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              {siteWise.data.data.map((row: { id: string; name: string; submissions: number }) => (
                <li key={row.id} className="rounded-lg border border-neutral-200 p-2.5">
                  <p className="font-medium text-neutral-700">{row.name}</p>
                  <p className="mt-1 text-xl font-bold text-black">{formatNumber(Number(row.submissions || 0))}</p>
                  <p className="text-xs text-neutral-500">submissions</p>
                </li>
              ))}
            </ul>
          ) : <EmptyState message="No site-wise data." />)}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-5 w-5 text-violet-600" /> Submissions Graph</h3>
            <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">Numbers + Bars</span>
          </div>

          {siteWise.isLoading ? <LoadingState label="Loading graph..." /> : null}
          {siteWise.isError ? <ErrorState message={siteWise.error.message} /> : null}
          {!siteWise.isLoading && !siteWise.isError && siteChartRows.length === 0 ? <EmptyState message="No graph data." /> : null}

          {!siteWise.isLoading && !siteWise.isError && siteChartRows.length > 0 ? (
            <div className="mt-4 h-72">
              <SiteSubmissionsBarChart data={siteChartRows} />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><MessageSquareText className="h-5 w-5 text-sky-600" /> Admin Chat</h3>
          <p className="mt-1 text-xs text-neutral-500">Team coordination channel</p>

          <div className="mt-3 h-56 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            {messages.map((msg) => (
              <article key={msg.id} className={`max-w-[85%] rounded-lg border p-2.5 text-sm ${msg.mine ? "ml-auto border-sky-200 bg-sky-50" : "border-neutral-200 bg-white"}`}>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-700">{msg.author}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="mt-1 text-neutral-800">{msg.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <button type="button" onClick={sendMessage} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
              Send
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Submission Status Mix</h3>
          <p className="mt-1 text-xs text-neutral-500">Recent submissions status distribution</p>
          <div className="mt-4 h-72">
            <SubmissionStatusPieChart data={submissionStatusData} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
