import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { PreferenceFormatSwitch } from "@/components/shared/preferences/PreferenceFormatSwitch";

type CompactOption = "full" | "compact";
const OPTIONS: readonly [CompactOption, CompactOption] = ["full", "compact"];

export function CompactNumbersSwitcher() {
  const compact = useDisplayPreferencesStore((s) => s.compactNumbers);
  const setCompact = useDisplayPreferencesStore((s) => s.setCompactNumbers);

  return (
    <PreferenceFormatSwitch
      options={OPTIONS}
      value={compact ? "compact" : "full"}
      onChange={(next) => setCompact(next === "compact")}
      i18nPrefix="settings.compactNumbers"
      toastKey="toast.compactNumbersChanged"
    />
  );
}
