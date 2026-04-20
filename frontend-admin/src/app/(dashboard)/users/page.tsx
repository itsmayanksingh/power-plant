"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { DataTableWrapper } from "@/components/tables/DataTableWrapper";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { AppModal } from "@/components/common/AppModal";
import { StatusToggle } from "@/components/common/StatusToggle";
import { queryKeys } from "@/lib/api/query-keys";
import { activateUser, createUser, deactivateUser, getUsers, updateUser } from "@/services/users.service";
import type { User } from "@/types/user";

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

export default function UsersPage() {
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

  const users = useMemo(() => usersQuery.data?.data?.items || [], [usersQuery.data]);

  const onCreate = async (values: CreateUserValues) => {
    try {
      await createMutation.mutateAsync(values);
    } catch (error) {
      console.error(error);
    }
  };

  const onEdit = async (values: UpdateUserValues) => {
    if (!editUser) return;
    try {
      await updateMutation.mutateAsync({ id: editUser.id, payload: values });
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
        <button type="button" onClick={() => setIsCreateOpen(true)} className="rounded-md bg-black px-3 py-2 text-sm text-white">
          Create User
        </button>
      }
    >
      <FilterBar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full min-w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
                <tr key={user.id} className="border-t border-neutral-200">
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
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
                        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
                        onClick={() => {
                          setEditUser(user);
                          editForm.reset({ name: user.name, role: user.role, phone: user.phone || "" });
                        }}
                      >
                        Edit
                      </button>
                      <Link href={`/users/${user.id}`} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">
                        View
                      </Link>
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
            <select {...createForm.register("role")} className="rounded border border-neutral-300 px-3 py-2">
              <option value="employee">employee</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            <input {...createForm.register("phone")} placeholder="Phone" className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-neutral-300 px-3 py-1.5" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="rounded bg-black px-3 py-1.5 text-white" disabled={createMutation.isPending}>
              Save
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal title="Edit User" open={Boolean(editUser)} onClose={() => setEditUser(null)}>
        <form onSubmit={editForm.handleSubmit(onEdit)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input {...editForm.register("name")} placeholder="Name" className="rounded border border-neutral-300 px-3 py-2" />
            <select {...editForm.register("role")} className="rounded border border-neutral-300 px-3 py-2">
              <option value="employee">employee</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            <input {...editForm.register("phone")} placeholder="Phone" className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-neutral-300 px-3 py-1.5" onClick={() => setEditUser(null)}>
              Cancel
            </button>
            <button type="submit" className="rounded bg-black px-3 py-1.5 text-white" disabled={updateMutation.isPending}>
              Update
            </button>
          </div>
        </form>
      </AppModal>
    </PageShell>
  );
}
