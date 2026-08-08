import { Outlet, useParams } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/i18n";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import NotFound from "@/routes/not-found";

export default function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const isValid = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);

  useEffect(() => {
    // An invalid segment (e.g. NotFound rendered below for /asdf) still
    // renders in whatever language i18n is actually active in — sync the
    // html attributes to that instead of leaving them at root.tsx's
    // hardcoded "en"/ltr default, or an RTL language renders left-to-right.
    const activeLang = isValid
      ? (lang as SupportedLanguage)
      : SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
        ? (i18n.language as SupportedLanguage)
        : DEFAULT_LANGUAGE;
    document.documentElement.lang = activeLang;
    document.documentElement.dir = RTL_LANGUAGES.includes(activeLang) ? "rtl" : "ltr";
    if (!isValid) return;
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
    localStorage.setItem(STORAGE_KEYS.lang, lang as string);
  }, [lang, isValid, i18n, i18n.language]);

  if (!isValid) return <NotFound />;
  return <Outlet />;
}
