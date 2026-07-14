import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";

/**
 * Shared body of the two icon "flip" toggles (theme, balance visibility):
 * either a tooltip-wrapped square icon button, or — with `showLabel` — a
 * full-width labeled chip matching LinkToggle's btn-ghost style.
 */
export function IconToggleButton({
  icon: Icon,
  label,
  onClick,
  className = "",
  showLabel = false,
}: {
  icon: LucideIcon;
  /** Describes the state the click switches TO; doubles as tooltip + aria-label. */
  label: string;
  onClick: () => void;
  className?: string;
  showLabel?: boolean;
}) {
  if (showLabel) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`btn btn-ghost bg-base-200 justify-start gap-1.5 font-medium ${className}`}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        className={`bg-base-200 btn btn-ghost btn-sm btn-square ${className}`}
        aria-label={label}
      >
        <Icon className="size-4" />
      </button>
    </Tooltip>
  );
}
