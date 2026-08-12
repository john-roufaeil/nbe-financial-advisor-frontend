import { useEffect, useRef } from "react";
import { usePreferences } from "@/queries/preferences";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import type { PreferenceDateFormat } from "@/types/preferences";

const BACKEND_TO_DATE_FORMAT: Record<PreferenceDateFormat, "dmy" | "mdy"> = {
  "DD/MM/YYYY": "dmy",
  "MM/DD/YYYY": "mdy",
};

/**
 * Pulls `dateFormat` from GET /users/me/preferences once per app session and
 * applies it locally, so a choice made on one device/browser shows up on the
 * next instead of silently resetting to the local default. The only field
 * synced this way today — see types/preferences.ts for why the others
 * aren't. `language` deliberately isn't auto-applied here: this app's
 * language is driven by the `:lang` URL segment (LangLayout), and silently
 * overriding it on mount without navigating risks desyncing the two: a
 * real fix needs a navigation decision, not a guess, so for now the
 * language switcher only PATCHes the choice, it doesn't get pulled back.
 */
export function useSyncPreferencesFromServer() {
  const { data } = usePreferences();
  const setDateFormat = useDisplayPreferencesStore((s) => s.setDateFormat);
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!data || appliedRef.current) return;
    appliedRef.current = true;

    const dateFormat = BACKEND_TO_DATE_FORMAT[data.dateFormat];
    if (dateFormat) setDateFormat(dateFormat);
  }, [data, setDateFormat]);
}
