import { useParams, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { useLanguageSwitchStore } from "@/store/use-language-switch-store";
import { useUpdatePreferences } from "@/queries/preferences";
import { useAuthStore } from "@/store/use-auth-store";

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updatePreferences = useUpdatePreferences();

  // Driven by the actual active i18n language, not the :lang route param —
  // the two are normally kept in sync by LangLayout, but the param is
  // undefined outright on unprefixed pages (verify-email, reset-password),
  // and relying on it left the toggle showing/targeting the wrong language
  // whenever it briefly lagged the real one. i18n.language is what every
  // t() call in the app is actually rendering from, so it can't disagree
  // with what's on screen.
  const current = SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
    ? (i18n.language as SupportedLanguage)
    : SUPPORTED_LANGUAGES[0];
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
      // Unprefixed pages (no :lang segment at all — verify-email,
      // reset-password, the links emailed to a user with no locale
      // context) have no path segment to rewrite; changing the i18n
      // language alone re-renders them in place. Rewriting to
      // `/${next}${rest}` here would build a `/ar/verify-email`-style path
      // that doesn't exist as a route and 404s via the :lang/* catch-all.
      if (lang !== undefined) {
        // Don't call i18n.changeLanguage here — LangLayout is the sole
        // owner of that call for prefixed pages, driven by the :lang param.
        // Calling it here too raced LangLayout: for one tick i18n.language
        // was already "ar" while the URL (and LangLayout's still-mounted
        // instance) was still "/en/...", so LangLayout "corrected" i18n
        // back to "en" before the navigate below landed and flipped it
        // forward again — a visible en/ar/en/ar bounce in the tab title.
        // Navigating first keeps i18n.language and the URL changing in one
        // step, from LangLayout's perspective.
        const rest = location.pathname.replace(`/${current}`, "");
        navigate(`/${next}${rest}${location.search}`);
      } else {
        await i18n.changeLanguage(next);
      }
      // Guest pages (splash, sign-in, onboarding) share this same switcher —
      // only persist server-side once actually signed in, or this 401s.
      if (isAuthenticated) updatePreferences.mutate({ language: next });
      setPendingToast(t("toast.languageChanged"));
    } catch {
      setPendingLang(null);
    }
  }

  return { current, labels, switchTo, isSwitching: pendingLang !== null };
}
