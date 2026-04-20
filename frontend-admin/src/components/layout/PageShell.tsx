import { BackButton } from "@/components/common/BackButton";

export function PageShell({
  title,
  description,
  action,
  children,
  showBackButton = false,
  backFallbackHref,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  showBackButton?: boolean;
  backFallbackHref?: string;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            {showBackButton ? <BackButton fallbackHref={backFallbackHref || "/dashboard"} /> : null}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-black">{title}</h2>
              {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
            </div>
          </div>
          {action}
        </div>
      </section>
      {children}
    </div>
  );
}
