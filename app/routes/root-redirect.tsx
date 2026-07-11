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
  // Same session test as RequireAuth: a rehydrated flag without an in-memory
  // token is not a session, so don't send the user somewhere they'll bounce off.
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const lang = getPreferredLanguage();
  return <Navigate to={hasSession ? `/${lang}/dashboard` : `/${lang}`} replace />;
}
