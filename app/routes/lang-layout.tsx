import { Navigate, Outlet, useParams } from "react-router";
import { useEffect } from "react";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
const RTL_LANGUAGES: SupportedLanguage[] = ["ar"];

export default function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const isValid = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);

  useEffect(() => {
    if (!isValid) return;
    document.documentElement.lang = lang as string;
    document.documentElement.dir = RTL_LANGUAGES.includes(
      lang as SupportedLanguage,
    )
      ? "rtl"
      : "ltr";
  }, [lang, isValid]);

  if (!isValid) return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;

  return <Outlet />;
}