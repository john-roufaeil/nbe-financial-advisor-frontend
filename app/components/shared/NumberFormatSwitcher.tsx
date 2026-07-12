import { useTranslation } from "react-i18next";
import { useNumberFormatStore, type NumberFormat } from "@/store/use-number-format-store";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

const OPTIONS: readonly [NumberFormat, NumberFormat] = ["comma", "period"];

export function NumberFormatSwitcher() {
  const { t } = useTranslation();
  const format = useNumberFormatStore((s) => s.format);
  const setFormat = useNumberFormatStore((s) => s.setFormat);
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
