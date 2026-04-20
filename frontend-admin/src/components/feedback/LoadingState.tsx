export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 text-sm text-neutral-600">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-neutral-400" />
        {label}
      </div>
    </div>
  );
}
