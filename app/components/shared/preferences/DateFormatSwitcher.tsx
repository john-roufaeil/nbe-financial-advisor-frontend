import { useTranslation } from "react-i18next";
import {
  useDisplayPreferencesStore,
  type DateFormat,
} from "@/store/use-display-preferences-store";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/forms/ToggleSwitch";

const OPTIONS: readonly [DateFormat, DateFormat] = ["dmy", "mdy"];

export function DateFormatSwitcher() {
  const { t } = useTranslation();
  const format = useDisplayPreferencesStore((s) => s.dateFormat);
  const setFormat = useDisplayPreferencesStore((s) => s.setDateFormat);
  const showToast = useToastStore((s) => s.show);

  const labels: Record<DateFormat, string> = {
    dmy: t("settings.dateFormat.dmy"),
    mdy: t("settings.dateFormat.mdy"),
  };

  return (
    <ToggleSwitch
      value={format}
      options={OPTIONS}
      labels={labels}
      forceLtrOrder
      onChange={(next) => {
        setFormat(next);
        showToast(t("toast.dateFormatChanged", { format: labels[next] }), "info");
      }}
      aria-label={t("settings.dateFormat.label")}
    />
  );
}
