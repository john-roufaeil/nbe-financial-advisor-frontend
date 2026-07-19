import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { useToastStore } from "@/store/use-toast-store";
import { useLanguageSwitchStore } from "@/store/use-language-switch-store";

/**
 * Owns clearing the in-flight language-switch lock and firing its queued
 * toast, in exactly one place. Mount this once at the app root.
 *
 * `useLanguageSwitch()` (used by every toggle — sidebar, preferences menu,
 * auth layout) used to run this same effect itself, which was fine with one
 * toggle mounted but fired the toast once per *mounted* toggle instance:
 * the profile page has both the sidebar's and the preferences menu's toggle
 * mounted at once, so a single switch produced two stacked toasts.
 */
export function useLanguageSwitchWatcher() {
  // Same i18n.language-based source of truth as useLanguageSwitch's
  // `current` — see that hook's comment for why this can't be the :lang
  // route param (undefined on unprefixed pages, and can otherwise lag the
  // actual active language, which left this watcher never observing the
  // switch "land" and so never clearing the in-flight lock).
  const { i18n } = useTranslation();
  const current = SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
    ? (i18n.language as SupportedLanguage)
    : SUPPORTED_LANGUAGES[0];
  const showToast = useToastStore((s) => s.show);
  const pendingLang = useLanguageSwitchStore((s) => s.pendingLang);
  const pendingToast = useLanguageSwitchStore((s) => s.pendingToast);
  const setPendingLang = useLanguageSwitchStore((s) => s.setPendingLang);
  const setPendingToast = useLanguageSwitchStore((s) => s.setPendingToast);

  useEffect(() => {
    if (pendingLang !== null && current === pendingLang) {
      setPendingLang(null);
      if (pendingToast) {
        showToast(pendingToast, "info");
        setPendingToast(null);
      }
    }
  }, [current, pendingLang, pendingToast, setPendingLang, setPendingToast, showToast]);
}
