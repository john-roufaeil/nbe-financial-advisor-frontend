import type { ComponentType, ReactNode } from "react";
import { Tooltip } from "@/components/shared/Tooltip";

/**
 * One tile in the dashboard's "Quick insights" row — same grid-tile shape as
 * the headline stat tiles above it (StatsGrid), just a single info line
 * instead of a big number + delta, so the two rows read as one consistent
 * family (hairline-divided grid) rather than two different visual languages.
 */
export function InsightTile({
  icon: Icon,
  tone,
  label,
  value,
  trailing,
  tooltip,
}: {
  icon: ComponentType<{ className?: string; "data-no-flip"?: boolean }>;
  tone: string;
  label: string;
  value: ReactNode;
  trailing?: ReactNode;
  tooltip: string;
}) {
  return (
    <Tooltip content={tooltip} className="h-full w-full">
      <div className="flex h-full items-center gap-2 p-3">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}>
          <Icon data-no-flip className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base-content/60 truncate text-xs">{label}</p>
          <p className="truncate text-base font-semibold tabular-nums">{value}</p>
        </div>
        {trailing && <div className="ms-auto shrink-0">{trailing}</div>}
      </div>
    </Tooltip>
  );
}
