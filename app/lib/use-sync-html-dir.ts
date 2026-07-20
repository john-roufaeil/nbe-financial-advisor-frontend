import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RTL_LANGUAGES, type SupportedLanguage } from "@/i18n";

/**
 * Keeps `document.documentElement`'s `dir`/`lang` in sync with the active
 * i18n language for pages that render outside LangLayout — verify-email and
 * reset-password are unprefixed (no `:lang` route param for LangLayout's own
 * dir-setting effect to key off, see that component), so without this the
 * text renders in whatever language i18n detected while `dir` stays stuck at
 * whatever it was before landing on the page. LangLayout remains the source
 * of truth for every `:lang`-prefixed page; this only fills the gap for the
 * two that aren't.
 */
export function useSyncHtmlDir() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language as SupportedLanguage;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  }, [i18n.language]);
}
