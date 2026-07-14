import type { ComponentType } from "react";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  /** Same icon used for this page in the nav sidebar — rendered large and faint in the background. */
  icon: ComponentType<{ className?: string; "data-no-flip"?: boolean }>;
  /** Buttons/toggles for this page, shown inside the gradient banner. */
  actions?: React.ReactNode;
}

export function PageBanner({ title, subtitle, icon: Icon, actions }: PageBannerProps) {
  return (
    <div className="animate-entry from-primary to-primary/80 text-primary-content relative overflow-hidden rounded-xl bg-linear-to-br p-5 shadow-sm">
      <Icon data-no-flip className="absolute -inset-e-4 -bottom-4 size-28 opacity-10" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm opacity-80">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
