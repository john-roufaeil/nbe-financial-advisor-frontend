import { Navigate } from "react-router";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "./lang-layout";
import { useAuthStore } from "@/store/use-auth-store";

function getPreferredLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)
    ? (stored as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

export default function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lang = getPreferredLanguage();
  return <Navigate to={isAuthenticated ? `/${lang}/dashboard` : `/${lang}`} replace />;
}
