import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

/** A row-shaped pulse placeholder for list content — reduces layout shift and reads as "loading this list" rather than a generic blocking spinner. */
export function ListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-3"
        >
          <div className="bg-base-200 size-9 shrink-0 animate-pulse rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="bg-base-200 h-3.5 w-2/5 animate-pulse rounded" />
            <div className="bg-base-200 h-3 w-3/5 animate-pulse rounded" />
          </div>
          <div className="bg-base-200 h-4 w-14 shrink-0 animate-pulse rounded" />
        </li>
      ))}
    </ul>
  );
}

/** A card-shaped pulse placeholder for grid content (stat cards, summary tiles, etc.). */
export function CardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card border-base-300 bg-base-100 border shadow-sm">
          <div className="card-body gap-3 p-4">
            <div className="flex items-center gap-2">
              <div className="bg-base-200 size-9 shrink-0 animate-pulse rounded-lg" />
              <div className="bg-base-200 h-3 w-2/3 animate-pulse rounded" />
            </div>
            <div className="bg-base-200 h-6 w-1/2 animate-pulse rounded" />
            <div className="bg-base-200 h-4 w-1/3 animate-pulse rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="border-error/20 bg-error/5 flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
      <span className="bg-error/10 text-error grid size-11 place-items-center rounded-full">
        <TriangleAlert className="size-5" />
      </span>
      <p className="text-base-content/70 max-w-xs text-sm">
        {message ?? t("data.loadError")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-error btn-outline btn-sm"
      >
        {t("data.retry")}
      </button>
    </div>
  );
}

export function EmptyState({
  label,
  icon: Icon,
}: {
  label?: string;
  icon?: typeof TriangleAlert;
}) {
  const { t } = useTranslation();
  return (
    <div className="border-base-300 flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-center">
      {Icon && (
        <span className="bg-base-200 text-base-content/40 grid size-11 place-items-center rounded-full">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-base-content/50 text-sm">{label ?? t("data.noResults")}</p>
    </div>
  );
}
