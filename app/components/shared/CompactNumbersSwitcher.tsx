import { useTranslation } from "react-i18next";
import { useCompactNumbersStore } from "@/store/use-compact-numbers-store";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

type CompactOption = "full" | "compact";
const OPTIONS: readonly [CompactOption, CompactOption] = ["full", "compact"];

export function CompactNumbersSwitcher() {
  const { t } = useTranslation();
  const compact = useCompactNumbersStore((s) => s.compact);
  const setCompact = useCompactNumbersStore((s) => s.setCompact);
  const showToast = useToastStore((s) => s.show);

  const labels: Record<CompactOption, string> = {
    full: t("settings.compactNumbers.full"),
    compact: t("settings.compactNumbers.compact"),
  };

  return (
    <ToggleSwitch
      value={compact ? "compact" : "full"}
      options={OPTIONS}
      labels={labels}
      forceLtrOrder
      onChange={(next) => {
        setCompact(next === "compact");
        showToast(t("toast.compactNumbersChanged", { format: labels[next] }), "info");
      }}
      aria-label={t("settings.compactNumbers.label")}
    />
  );
}
