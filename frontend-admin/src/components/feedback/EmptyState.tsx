export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600 shadow-sm">
      {message}
    </div>
  );
}
