import type { ComponentType } from "react";
import { LoadingAnnouncement } from "@/components/shared/skeletons/LoadingAnnouncement";
import {
  SkeletonRowItem,
  type SkeletonRow,
} from "@/components/shared/skeletons/SkeletonRows";

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
    <>
      <LoadingAnnouncement />
      <div
        className={`card border-base-300 bg-base-100 border shadow-sm ${fullHeight ? "h-full" : ""} ${className}`}
        aria-hidden="true"
      >
        <div className="card-body p-4">{renderBody()}</div>
      </div>
    </>
  );
}
