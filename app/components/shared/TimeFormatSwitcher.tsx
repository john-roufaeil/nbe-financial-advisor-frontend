import { useTranslation } from "react-i18next";
import { useTimeFormatStore, type TimeFormat } from "@/store/use-time-format-store";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

const OPTIONS: readonly [TimeFormat, TimeFormat] = ["12h", "24h"];

export function TimeFormatSwitcher() {
  const { t } = useTranslation();
  const format = useTimeFormatStore((s) => s.format);
  const setFormat = useTimeFormatStore((s) => s.setFormat);

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
      onChange={setFormat}
      aria-label={t("settings.timeFormat.label")}
    />
  );
}
