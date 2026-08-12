import {
  useDisplayPreferencesStore,
  type DateFormat,
} from "@/store/use-display-preferences-store";
import { PreferenceFormatSwitch } from "@/components/shared/preferences/PreferenceFormatSwitch";
import { useUpdatePreferences } from "@/queries/preferences";
import type { PreferenceDateFormat } from "@/types/preferences";

const OPTIONS: readonly [DateFormat, DateFormat] = ["dmy", "mdy"];

const TO_BACKEND_FORMAT: Record<DateFormat, PreferenceDateFormat> = {
  dmy: "DD/MM/YYYY",
  mdy: "MM/DD/YYYY",
};

export function DateFormatSwitcher() {
  const format = useDisplayPreferencesStore((s) => s.dateFormat);
  const setFormat = useDisplayPreferencesStore((s) => s.setDateFormat);
  const updatePreferences = useUpdatePreferences();

  return (
    <PreferenceFormatSwitch
      options={OPTIONS}
      value={format}
      onChange={(next) => {
        setFormat(next);
        updatePreferences.mutate({ dateFormat: TO_BACKEND_FORMAT[next] });
      }}
      i18nPrefix="settings.dateFormat"
      toastKey="toast.dateFormatChanged"
    />
  );
}
