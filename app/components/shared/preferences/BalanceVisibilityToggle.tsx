import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { IconToggleButton } from "@/components/shared/preferences/IconToggleButton";

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

  return (
    <IconToggleButton
      icon={hidden ? EyeOff : Eye}
      label={label}
      onClick={toggle}
      className={className}
      showLabel={showLabel}
    />
  );
}
