import { useTranslation } from "react-i18next";
import { useDateFormatStore, type DateFormat } from "@/store/use-date-format-store";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

const OPTIONS: readonly [DateFormat, DateFormat] = ["dmy", "mdy"];

export function DateFormatSwitcher() {
  const { t } = useTranslation();
  const format = useDateFormatStore((s) => s.format);
  const setFormat = useDateFormatStore((s) => s.setFormat);
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
