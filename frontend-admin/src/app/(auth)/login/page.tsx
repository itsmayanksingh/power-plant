"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login.schema";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await login(values);
      setSession(res.data);
      toast.success("Login successful");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-black">Admin Login</h1>
        <p className="mt-1 text-sm text-neutral-600">Sign in to manage plant operations</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
              type="email"
              {...form.register("email")}
            />
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.email?.message}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
              type="password"
              {...form.register("password")}
            />
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.password?.message}</p>
          </div>
        </div>

        <button type="submit" className="mt-5 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
