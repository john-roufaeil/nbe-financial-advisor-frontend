import { Navigate } from "react-router";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { useAuthStore } from "@/store/use-auth-store";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

function getPreferredLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEYS.lang);
  return SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)
    ? (stored as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

export default function RootRedirect() {
  // Same session test as RequireAuth: a rehydrated flag without an in-memory
  // token is not a session, so don't send the user somewhere they'll bounce off.
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const lang = getPreferredLanguage();
  return (
    <Navigate
      to={
        hasSession ? localizedPath(lang, ROUTE_SEGMENTS.dashboard) : localizedPath(lang)
      }
      replace
    />
  );
}
