import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

/**
 * "Go to home" for an already-signed-in user, "Go to sign in" otherwise —
 * for landing pages (verify-email, reset-password) that can be reached
 * either mid-session (a second tab) or fully signed out, where a single
 * fixed CTA would be wrong for one of the two. Those pages are unprefixed
 * (no :lang in the URL), so this reads the active i18n language rather
 * than a route param — same reasoning as useLanguageSwitch's `current`,
 * since a user can switch language on these pages without the URL
 * changing to reflect it.
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
