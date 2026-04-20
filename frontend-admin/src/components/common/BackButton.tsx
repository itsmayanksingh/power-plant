"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallbackHref = "/dashboard", label = "Back" }: { fallbackHref?: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-neutral-100"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
