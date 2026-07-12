import { useTranslation } from "react-i18next";
import {
  useDisplayPreferencesStore,
  type NumberFormat,
} from "@/store/use-display-preferences-store";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/forms/ToggleSwitch";

const OPTIONS: readonly [NumberFormat, NumberFormat] = ["comma", "period"];

export function NumberFormatSwitcher() {
  const { t } = useTranslation();
  const format = useDisplayPreferencesStore((s) => s.numberFormat);
  const setFormat = useDisplayPreferencesStore((s) => s.setNumberFormat);
  const showToast = useToastStore((s) => s.show);

  const labels: Record<NumberFormat, string> = {
    comma: t("settings.numberFormat.comma"),
    period: t("settings.numberFormat.period"),
  };

  return (
    <ToggleSwitch
      value={format}
      options={OPTIONS}
      labels={labels}
      forceLtrOrder
      onChange={(next) => {
        setFormat(next);
        showToast(t("toast.numberFormatChanged", { format: labels[next] }), "info");
      }}
      aria-label={t("settings.numberFormat.label")}
    />
  );
}
