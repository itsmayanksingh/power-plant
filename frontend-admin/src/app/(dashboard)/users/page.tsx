"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, Shield, UserCheck, UserRound, UsersRound } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { DataTableWrapper } from "@/components/tables/DataTableWrapper";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { AppModal } from "@/components/common/AppModal";
import { StatusToggle } from "@/components/common/StatusToggle";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { queryKeys } from "@/lib/api/query-keys";
import { activateUser, createUser, deactivateUser, deleteUser, getUsers, updateUser } from "@/services/users.service";
import type { User } from "@/types/user";
import { useAuthStore } from "@/store/auth.store";
import { readAccessTokenPayload } from "@/lib/auth/jwt-payload";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["superadmin", "admin", "employee"]),
  phone: z.string().optional(),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

const updateSchema = z.object({
  name: z.string().min(2),
  role: z.enum(["superadmin", "admin", "employee"]),
  phone: z.string().optional(),
});

type UpdateUserValues = z.infer<typeof updateSchema>;

type UsersEnvelope = {
  data?: {
    items?: User[];
  };
};

function roleBadgeClass(role: User["role"]) {
  if (role === "superadmin") return "border-red-200 bg-red-50 text-red-700";
  if (role === "admin") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const role = currentUser?.role ?? readAccessTokenPayload()?.role;
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  const usersKey = queryKeys.users({ search });

  const usersQuery = useQuery({
    queryKey: usersKey,
    queryFn: () => getUsers({ search, page: 1, limit: 50 }),
  });

  const createForm = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "employee", phone: "" },
  });

  const editForm = useForm<UpdateUserValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: "", role: "employee", phone: "" },
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateUser(id, payload),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      setEditUser(null);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update user"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => (active ? activateUser(id) : deactivateUser(id)),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: usersKey });
      const previous = queryClient.getQueryData<UsersEnvelope>(usersKey);
      queryClient.setQueryData<UsersEnvelope>(usersKey, (old) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((u) => (u.id === id ? { ...u, isActive: active } : u)),
          },
        };
      });
      return { previous };
    },
    onSuccess: (_, vars) => {
      toast.success(vars.active ? "User activated via toggle" : "User deactivated via toggle");
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersKey, context.previous);
      }
      toast.error(error.message || "Status update failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
    onError: (error: Error) => toast.error(error.message || "Delete failed"),
  });

  const users = useMemo<User[]>(() => usersQuery.data?.data?.items || [], [usersQuery.data]);
  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u: User) => u.isActive).length;
    const admins = users.filter((u: User) => u.role === "admin").length;
    const employees = users.filter((u: User) => u.role === "employee").length;
    return { total, active, admins, employees };
  }, [users]);

  const onCreate = async (values: CreateUserValues) => {
    try {
      const payload = isAdmin ? { ...values, role: "employee" as const } : values;
      await createMutation.mutateAsync(payload);
    } catch (error) {
      console.error(error);
    }
  };

  const onEdit = async (values: UpdateUserValues) => {
    if (!editUser) return;
    try {
      const payload = isAdmin ? { ...values, role: "employee" } : values;
      await updateMutation.mutateAsync({ id: editUser.id, payload });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageShell
      showBackButton
      backFallbackHref="/dashboard"
      title="Users"
      description="Manage admins and employees"
      action={
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Create User
        </button>
      }
    >
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Total Users</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-black">{userStats.total}</p>
            <UsersRound className="h-5 w-5 text-[var(--primary)]" />
          </div>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Active</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-black">{userStats.active}</p>
            <UserCheck className="h-5 w-5 text-[var(--success)]" />
          </div>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Admins</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-black">{userStats.admins}</p>
            <Shield className="h-5 w-5 text-[var(--warning)]" />
          </div>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Employees</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-black">{userStats.employees}</p>
            <UserRound className="h-5 w-5 text-neutral-700" />
          </div>
        </article>
      </section>

      <FilterBar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full min-w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm"
        />
      </FilterBar>

      {usersQuery.isLoading ? <LoadingState label="Loading users..." /> : null}
      {usersQuery.isError ? <ErrorState message={usersQuery.error.message} /> : null}
      {!usersQuery.isLoading && !usersQuery.isError && !users.length ? <EmptyState message="No users found" /> : null}

      {!usersQuery.isLoading && !usersQuery.isError && users.length ? (
        <DataTableWrapper>
          <table className="min-w-full">
            <thead className="bg-neutral-50 text-left text-neutral-700">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.id} className="border-t border-neutral-200 hover:bg-neutral-50/70">
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full border border-neutral-200 bg-white p-1.5">
                        <UserRound className="h-3.5 w-3.5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-800">{user.name}</p>
                        <p className="text-xs text-neutral-500">ID: {user.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="inline-flex items-center gap-1.5 text-neutral-700">
                      <Mail className="h-3.5 w-3.5 text-neutral-500" />
                      {user.email}
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${roleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <StatusToggle
                      checked={Boolean(user.isActive)}
                      onChange={(next) => statusMutation.mutate({ id: user.id, active: next })}
                      disabled={statusMutation.isPending}
                      activeLabel="Active"
                      inactiveLabel="Inactive"
                    />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          setEditUser(user);
                          editForm.reset({ name: user.name, role: user.role, phone: user.phone || "" });
                        }}
                      >
                        Edit
                      </button>
                      <Link href={`/users/${user.id}`} className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs font-medium hover:bg-neutral-100">
                        View
                      </Link>
                      <ConfirmDialog
                        title="Delete User"
                        description={`Delete ${user.name}? This will deactivate the user.`}
                        triggerLabel="Delete"
                        onConfirm={async () => {
                          await deleteMutation.mutateAsync(user.id);
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

      <AppModal title="Create User" open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <form onSubmit={createForm.handleSubmit(onCreate)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input {...createForm.register("name")} placeholder="Name" className="rounded border border-neutral-300 px-3 py-2" />
            <input {...createForm.register("email")} placeholder="Email" className="rounded border border-neutral-300 px-3 py-2" />
            <input {...createForm.register("password")} type="password" placeholder="Password" className="rounded border border-neutral-300 px-3 py-2" />
            <select {...createForm.register("role")} className="rounded border border-neutral-300 px-3 py-2" disabled={isAdmin}>
              <option value="employee">employee</option>
              {!isAdmin ? <option value="admin">admin</option> : null}
            </select>
            <input {...createForm.register("phone")} placeholder="Phone" className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-neutral-300 px-3 py-1.5" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700" disabled={createMutation.isPending}>
              Save
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal title="Edit User" open={Boolean(editUser)} onClose={() => setEditUser(null)}>
        <form onSubmit={editForm.handleSubmit(onEdit)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input {...editForm.register("name")} placeholder="Name" className="rounded border border-neutral-300 px-3 py-2" />
            <select {...editForm.register("role")} className="rounded border border-neutral-300 px-3 py-2" disabled={isAdmin || editUser?.role === "superadmin"}>
              <option value="employee">employee</option>
              {!isAdmin ? <option value="admin">admin</option> : null}
            </select>
            <input {...editForm.register("phone")} placeholder="Phone" className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-neutral-300 px-3 py-1.5" onClick={() => setEditUser(null)}>
              Cancel
            </button>
            <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700" disabled={updateMutation.isPending}>
              Update
            </button>
          </div>
        </form>
      </AppModal>
    </PageShell>
  );
}
