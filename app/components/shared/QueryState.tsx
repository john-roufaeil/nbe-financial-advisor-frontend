import type { ComponentType } from "react";
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

type SkeletonRow =
  /** A single pulsing text line, e.g. a label or paragraph. */
  | { kind: "text"; width?: string }
  /** A label + value pulsing pair, stacked — mirrors a form field or stat. */
  | { kind: "field"; labelWidth?: string }
  /** A label/value line above a pulsing progress bar — mirrors a goal or budget row. */
  | { kind: "progress"; trailingText?: boolean }
  /** N "field" rows laid out in a responsive 2-column grid — mirrors a section of form fields. */
  | { kind: "fieldGrid"; fields: number };

function SkeletonTextRow({ width = "w-2/3" }: { width?: string }) {
  return <div className={`bg-base-200 h-3.5 ${width} animate-pulse rounded`} />;
}

function SkeletonFieldRow({ labelWidth = "w-1/4" }: { labelWidth?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`bg-base-200 h-3 ${labelWidth} animate-pulse rounded`} />
      <div className="bg-base-200 h-5 w-full animate-pulse rounded" />
    </div>
  );
}

function SkeletonProgressRow({ trailingText }: { trailingText?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="bg-base-200 h-3.5 w-1/4 animate-pulse rounded" />
        <div className="bg-base-200 h-3.5 w-1/3 animate-pulse rounded" />
      </div>
      <div className="bg-base-200 h-2 w-full animate-pulse rounded-full" />
      {trailingText && <div className="bg-base-200 h-3 w-2/5 animate-pulse rounded" />}
    </div>
  );
}

function SkeletonRowItem({ row }: { row: SkeletonRow }) {
  switch (row.kind) {
    case "text":
      return <SkeletonTextRow width={row.width} />;
    case "field":
      return <SkeletonFieldRow labelWidth={row.labelWidth} />;
    case "progress":
      return <SkeletonProgressRow trailingText={row.trailingText} />;
    case "fieldGrid":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: row.fields }, (_, i) => (
            <SkeletonFieldRow key={i} />
          ))}
        </div>
      );
  }
}

/**
 * A card-shaped pulse placeholder matching the app's standard card chrome
 * (icon badge + title + body rows). Pass `rows` to mirror the real card's
 * internal layout (stat tiles, goal/budget progress lists, profile field
 * grids, etc.) so loading state keeps the same width/height as populated
 * state. Defaults to a simple stat-tile shape when no rows are given.
 */
export function CardSkeleton({
  cards = 1,
  icon: Icon,
  rows,
  donut,
  fullHeight,
  className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
}: {
  cards?: number;
  icon?: ComponentType<{ className?: string }>;
  /** Body rows mirroring the real card's layout. Omit for a plain stat-tile shape. */
  rows?: SkeletonRow[];
  /** Renders a circular placeholder beside the rows — mirrors a donut chart card. */
  donut?: boolean;
  fullHeight?: boolean;
  /** Wrapper className used when rendering more than one card. */
  className?: string;
}) {
  const iconBadge = (
    <span className="bg-base-200 grid size-9 shrink-0 place-items-center rounded-lg">
      {Icon && <Icon className="text-base-content/30 size-4.5" />}
    </span>
  );

  function renderBody() {
    if (!rows) {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {iconBadge}
            <div className="bg-base-200 h-3 w-2/3 animate-pulse rounded" />
          </div>
          <div className="bg-base-200 h-6 w-1/2 animate-pulse rounded" />
          <div className="bg-base-200 h-4 w-1/3 animate-pulse rounded-full" />
        </div>
      );
    }

    const rowItems = rows.map((row, i) => <SkeletonRowItem key={i} row={row} />);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {iconBadge}
          <div className="bg-base-200 h-4 w-1/3 animate-pulse rounded" />
        </div>
        {donut ? (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="bg-base-200 size-24 shrink-0 animate-pulse rounded-full" />
            <div className="flex w-full min-w-0 flex-1 flex-col gap-4">{rowItems}</div>
          </div>
        ) : (
          rowItems
        )}
      </div>
    );
  }

  if (cards <= 1) {
    return (
      <div
        className={`card border-base-300 bg-base-100 border shadow-sm ${fullHeight ? "h-full" : ""}`}
        aria-hidden="true"
      >
        <div className="card-body p-4">{renderBody()}</div>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card border-base-300 bg-base-100 border shadow-sm">
          <div className="card-body p-4">{renderBody()}</div>
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
