import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

/**
 * "Go to home" if already signed in, "Go to sign in" otherwise — for landing
 * pages (verify-email, reset-password) reachable either mid-session or fully
 * signed out. Those pages are unprefixed (no :lang in the URL), so this reads
 * the active i18n language instead of a route param.
 */
export function GoHomeOrSignInLink({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const lang = SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
    ? (i18n.language as SupportedLanguage)
    : DEFAULT_LANGUAGE;
  const to = hasSession
    ? localizedPath(lang, ROUTE_SEGMENTS.dashboard)
    : localizedPath(lang, ROUTE_SEGMENTS.signIn);

  return (
    <Link to={to} className={className}>
      {hasSession ? t("actions.goHome") : t("actions.goToSignIn")}
    </Link>
  );
}
