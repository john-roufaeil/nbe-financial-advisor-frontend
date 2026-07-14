import {
  useDisplayPreferencesStore,
  type TimeFormat,
} from "@/store/use-display-preferences-store";
import { PreferenceFormatSwitch } from "@/components/shared/preferences/PreferenceFormatSwitch";

const OPTIONS: readonly [TimeFormat, TimeFormat] = ["12h", "24h"];

export function TimeFormatSwitcher() {
  const format = useDisplayPreferencesStore((s) => s.timeFormat);
  const setFormat = useDisplayPreferencesStore((s) => s.setTimeFormat);

  return (
    <PreferenceFormatSwitch
      options={OPTIONS}
      value={format}
      onChange={setFormat}
      i18nPrefix="settings.timeFormat"
      toastKey="toast.timeFormatChanged"
    />
  );
}
