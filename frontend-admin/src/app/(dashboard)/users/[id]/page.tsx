"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { getUserById } from "@/services/users.service";
import { queryKeys } from "@/lib/api/query-keys";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();

  const userQuery = useQuery({
    queryKey: queryKeys.user(params.id),
    queryFn: () => getUserById(params.id),
    enabled: Boolean(params.id),
  });

  if (userQuery.isLoading) return <LoadingState label="Loading user..." />;
  if (userQuery.isError) return <ErrorState message={userQuery.error.message} />;

  const user = userQuery.data?.data;

  return (
    <PageShell showBackButton backFallbackHref="/users" title="User Detail" description="Detailed user profile">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Status:</strong> {user.isActive ? "Active" : "Inactive"}</p>
        <p><strong>Phone:</strong> {user.phone || "-"}</p>
      </div>
    </PageShell>
  );
}


