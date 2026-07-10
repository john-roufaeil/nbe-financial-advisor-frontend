import type { ComponentType } from "react";
import { TriangleAlert, Target, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

/** A row-shaped pulse placeholder for list content — reduces layout shift and reads as "loading this list" rather than a generic blocking spinner. */
export function ListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul className="animate-entry flex flex-col gap-2" aria-hidden="true">
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

/** Two-row card placeholders matching the grid view of the data tables. */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <ul
      className="animate-entry grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: cards }, (_, i) => (
        <li
          key={i}
          className="border-base-300 bg-base-100 flex flex-col gap-3 rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <div className="bg-base-200 size-9 shrink-0 animate-pulse rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="bg-base-200 h-3.5 w-2/5 animate-pulse rounded" />
              <div className="bg-base-200 h-3 w-3/5 animate-pulse rounded" />
            </div>
          </div>
          <div className="border-base-200 flex items-center justify-between border-t pt-2">
            <div className="bg-base-200 h-4 w-16 animate-pulse rounded" />
            <div className="flex gap-1">
              <div className="bg-base-200 size-7 animate-pulse rounded" />
              <div className="bg-base-200 size-7 animate-pulse rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

type SkeletonRow =
  | { kind: "text"; width?: string }
  | { kind: "field"; labelWidth?: string }
  | { kind: "progress"; trailingText?: boolean }
  | { kind: "fieldGrid"; fields: number }
  | { kind: "timeline"; milestones?: number };

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

// FIXED: Removed duplicated header definitions and added standard logical direction track classes
export function SkeletonTimelineRow({ milestones = 4 }: { milestones?: number }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Overview Metric Line Placeholder */}
      <div className="flex flex-col gap-1">
        <div className="bg-base-200 h-8 w-24 animate-pulse rounded" />
        <div className="bg-base-200 h-3.5 w-40 animate-pulse rounded" />
      </div>

      {/* Vertical Timeline Mock Track */}
      <div className="relative flex flex-col gap-8">
        {/* FIXED: Changed to start-[13px] and top-[14px] to avoid layout shift on different locales */}
        <div className="bg-base-200 absolute start-[13px] top-[14px] bottom-[14px] w-[2px] rounded-full" />

        {Array.from({ length: milestones }, (_, i) => (
          <div
            key={i}
            className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4"
          >
            {/* Column 1: Dot Placeholder */}
            <div className="bg-base-200 border-base-100 z-10 size-7 animate-pulse rounded-full border-4" />

            {/* Column 2: Milestone Text Labels */}
            <div className="flex flex-col gap-1.5">
              <div className="bg-base-200 h-3.5 w-12 animate-pulse rounded" />
              <div className="bg-base-200 h-3 w-16 animate-pulse rounded" />
            </div>

            {/* Column 3: Status Badge Placeholder */}
            <div className="bg-base-200 h-5 w-14 animate-pulse rounded-md" />
          </div>
        ))}
      </div>
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
    case "timeline":
      return <SkeletonTimelineRow milestones={row.milestones} />;
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

export function CardSkeleton({
  icon: Icon,
  rows,
  donut,
  fullHeight,
  className = "",
}: {
  icon?: ComponentType<{ className?: string }>;
  rows?: SkeletonRow[];
  donut?: boolean;
  fullHeight?: boolean;
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
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2">
            {iconBadge}
            <div className="bg-base-200 h-3.5 w-1/2 animate-pulse rounded" />
          </div>
          <div className="bg-base-200 h-6.5 w-3/4 animate-pulse rounded" />
          <div className="bg-base-200 h-4 w-2/3 animate-pulse rounded" />
        </div>
      );
    }

    const rowItems = rows.map((row, i) => <SkeletonRowItem key={i} row={row} />);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {iconBadge}
          {/* Heading line matches real card title structure perfectly */}
          <div className="bg-base-200 h-4 w-1/2 animate-pulse rounded" />
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

  return (
    <div
      className={`card border-base-300 bg-base-100 border shadow-sm ${fullHeight ? "h-full" : ""} ${className}`}
      aria-hidden="true"
    >
      <div className="card-body p-4">{renderBody()}</div>
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
  className = "",
}: {
  label?: string;
  icon?: typeof TriangleAlert;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`border-base-300 flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-center ${className}`}
    >
      {Icon && (
        <span className="bg-base-200 text-base-content/40 grid size-11 place-items-center rounded-full">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-base-content/50 w-full text-sm text-balance sm:w-1/2">
        {label ?? t("data.noResults")}
      </p>
    </div>
  );
}

export function GoalEmptyState({ onAddClick }: { onAddClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="border-base-300 bg-base-200/20 flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-4 py-8 text-center">
      <span className="bg-primary/10 text-primary/70 grid size-12 place-items-center rounded-full">
        <Target className="size-5.5" />
      </span>

      <div className="flex max-w-60 flex-col gap-1">
        <h3 className="text-base-content text-sm font-semibold">
          {t("dashboard.goals.emptyTitle", "No active goal")}
        </h3>
        <p className="text-base-content/50 text-xs">
          {t(
            "dashboard.goals.empty",
            "Set a financial target to track your progress milestones.",
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onAddClick}
        className="btn btn-primary btn-sm gap-2 font-medium normal-case shadow-sm"
      >
        <Plus className="size-4" />
        {t("dashboard.goals.addYours", "Create Goal")}
      </button>
    </div>
  );
}
