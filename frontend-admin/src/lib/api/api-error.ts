import { AxiosError } from "axios";
import { useUiStore } from "@/store/ui.store";

export function getApiErrorMessage(error: unknown, source?: string): string {
  const axiosError = error as AxiosError<{ message?: string; errors?: string[] }>;
  const message =
    axiosError?.response?.data?.message ||
    (axiosError?.response?.data?.errors && Array.isArray(axiosError.response.data.errors)
      ? axiosError.response.data.errors.join(", ")
      : axiosError?.message || "Something went wrong. Please try again.");

  if (typeof window !== "undefined") {
    const detailParts = [
      `status: ${axiosError?.response?.status ?? "n/a"}`,
      `url: ${axiosError?.config?.url ?? "n/a"}`,
      `method: ${axiosError?.config?.method ?? "n/a"}`,
      `message: ${message}`,
    ];

    useUiStore.getState().addErrorLog({
      source,
      message,
      details: detailParts.join("\n"),
    });
  }

  return message;
}
