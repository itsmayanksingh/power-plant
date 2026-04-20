"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function TablePagination({ page, limit, total }: { page: number; limit: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const maxPage = Math.max(1, Math.ceil(total / limit));

  const setPage = (nextPage: number) => {
    const search = new URLSearchParams(params.toString());
    search.set("page", String(nextPage));
    router.push(`${pathname}?${search.toString()}`);
  };

  return (
    <div className="flex items-center justify-between p-3 text-sm text-neutral-600">
      <span>Page {page} of {maxPage}</span>
      <div className="space-x-2">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-50">
          Prev
        </button>
        <button type="button" disabled={page >= maxPage} onClick={() => setPage(page + 1)} className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}
