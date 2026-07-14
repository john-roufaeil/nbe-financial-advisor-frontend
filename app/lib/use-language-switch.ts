import { useParams, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { useLanguageSwitchStore } from "@/store/use-language-switch-store";

/**
 * Single source of truth for switching the active language, shared by every
 * language toggle in the app (sidebar, preferences menu, auth layout). Two
 * independent copies of this logic used to exist and could drift — e.g. one
 * awaited `i18n.changeLanguage` before navigating and one didn't — which let
 * them race each other when both were mounted on the same page.
 */
export function useLanguageSwitch() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const pendingLang = useLanguageSwitchStore((s) => s.pendingLang);
  const setPendingLang = useLanguageSwitchStore((s) => s.setPendingLang);
  const setPendingToast = useLanguageSwitchStore((s) => s.setPendingToast);

  const current = (lang as SupportedLanguage) ?? SUPPORTED_LANGUAGES[0];
  const labels: Record<SupportedLanguage, string> = {
    en: t("settings.languageNames.en"),
    ar: t("settings.languageNames.ar"),
  };

  async function switchTo(next: SupportedLanguage) {
    if (useLanguageSwitchStore.getState().pendingLang !== null || next === current) {
      return;
    }
    setPendingLang(next);
    try {
      document.documentElement.lang = next;
      document.documentElement.dir = RTL_LANGUAGES.includes(next) ? "rtl" : "ltr";
      localStorage.setItem(STORAGE_KEYS.lang, next);
      await i18n.changeLanguage(next);
      setPendingToast(t("toast.languageChanged"));
      const rest = location.pathname.replace(`/${current}`, "");
      navigate(`/${next}${rest}${location.search}`);
    } catch {
      setPendingLang(null);
    }
  }

  return { current, labels, switchTo, isSwitching: pendingLang !== null };
}
