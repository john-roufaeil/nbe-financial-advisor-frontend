import {
  useDisplayPreferencesStore,
  type NumberFormat,
} from "@/store/use-display-preferences-store";
import { PreferenceFormatSwitch } from "@/components/shared/preferences/PreferenceFormatSwitch";

const OPTIONS: readonly [NumberFormat, NumberFormat] = ["comma", "period"];

export function NumberFormatSwitcher() {
  const format = useDisplayPreferencesStore((s) => s.numberFormat);
  const setFormat = useDisplayPreferencesStore((s) => s.setNumberFormat);

  return (
    <PreferenceFormatSwitch
      options={OPTIONS}
      value={format}
      onChange={setFormat}
      i18nPrefix="settings.numberFormat"
      toastKey="toast.numberFormatChanged"
    />
  );
}
