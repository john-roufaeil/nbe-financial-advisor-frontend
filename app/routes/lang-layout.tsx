import { Navigate, Outlet, useParams } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/i18n";

export const LANGUAGE_STORAGE_KEY = "nbe_lang";

export default function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const isValid = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);

  useEffect(() => {
    if (!isValid) return;
    document.documentElement.lang = lang as string;
    document.documentElement.dir = RTL_LANGUAGES.includes(lang as SupportedLanguage)
      ? "rtl"
      : "ltr";
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang as string);
  }, [lang, isValid, i18n]);

  if (!isValid) return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  return <Outlet />;
}
