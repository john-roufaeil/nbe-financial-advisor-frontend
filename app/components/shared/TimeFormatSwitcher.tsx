import { useTranslation } from "react-i18next";
import { useTimeFormatStore, type TimeFormat } from "@/store/use-time-format-store";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

const OPTIONS: readonly [TimeFormat, TimeFormat] = ["12h", "24h"];

export function TimeFormatSwitcher() {
  const { t } = useTranslation();
  const format = useTimeFormatStore((s) => s.format);
  const setFormat = useTimeFormatStore((s) => s.setFormat);
  const showToast = useToastStore((s) => s.show);

  const labels: Record<TimeFormat, string> = {
    "12h": t("settings.timeFormat.12h"),
    "24h": t("settings.timeFormat.24h"),
  };

  return (
    <ToggleSwitch
      value={format}
      options={OPTIONS}
      labels={labels}
      forceLtrOrder
      onChange={(next) => {
        setFormat(next);
        showToast(t("toast.timeFormatChanged", { format: labels[next] }), "info");
      }}
      aria-label={t("settings.timeFormat.label")}
    />
  );
}
