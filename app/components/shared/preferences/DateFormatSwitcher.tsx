import {
  useDisplayPreferencesStore,
  type DateFormat,
} from "@/store/use-display-preferences-store";
import { PreferenceFormatSwitch } from "@/components/shared/preferences/PreferenceFormatSwitch";

const OPTIONS: readonly [DateFormat, DateFormat] = ["dmy", "mdy"];

export function DateFormatSwitcher() {
  const format = useDisplayPreferencesStore((s) => s.dateFormat);
  const setFormat = useDisplayPreferencesStore((s) => s.setDateFormat);

  return (
    <PreferenceFormatSwitch
      options={OPTIONS}
      value={format}
      onChange={setFormat}
      i18nPrefix="settings.dateFormat"
      toastKey="toast.dateFormatChanged"
    />
  );
}
