import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";

/** The eye icon that shows/blurs every <Money> figure across the app — one shared toggle, one shared store. */
export function BalanceVisibilityToggle({
  className = "",
  showLabel = false,
}: {
  className?: string;
  /** Renders as a full-width labeled chip (matches LinkToggle's btn-ghost style) instead of an icon-only square button. */
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const hidden = useDisplayPreferencesStore((s) => s.balanceHidden);
  const toggle = useDisplayPreferencesStore((s) => s.toggleBalanceHidden);
  const label = hidden ? t("dashboard.showBalances") : t("dashboard.hideBalances");
  const Icon = hidden ? EyeOff : Eye;

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={toggle}
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
        onClick={toggle}
        className={`bg-base-200 btn btn-ghost btn-sm btn-square ${className}`}
        aria-label={label}
      >
        <Icon className="size-4" />
      </button>
    </Tooltip>
  );
}
