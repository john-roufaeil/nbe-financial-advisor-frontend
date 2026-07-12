import { useTranslation } from "react-i18next";
import {
  useDisplayPreferencesStore,
  type TimeFormat,
} from "@/store/use-display-preferences-store";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/forms/ToggleSwitch";

const OPTIONS: readonly [TimeFormat, TimeFormat] = ["12h", "24h"];

export function TimeFormatSwitcher() {
  const { t } = useTranslation();
  const format = useDisplayPreferencesStore((s) => s.timeFormat);
  const setFormat = useDisplayPreferencesStore((s) => s.setTimeFormat);
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
