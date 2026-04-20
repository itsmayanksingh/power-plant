import { cn } from "@/lib/utils/cn";

export function FilterBar({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-neutral-200 bg-white p-3 shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </section>
  );
}
