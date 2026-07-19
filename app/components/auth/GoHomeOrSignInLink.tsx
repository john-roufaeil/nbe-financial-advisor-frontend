import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";
import { DEFAULT_LANGUAGE } from "@/i18n";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

/**
 * "Go to home" for an already-signed-in user, "Go to sign in" otherwise —
 * for landing pages (verify-email, reset-password) that can be reached
 * either mid-session (a second tab) or fully signed out, where a single
 * fixed CTA would be wrong for one of the two.
 */
export function GoHomeOrSignInLink({
  lang,
  className,
}: {
  lang?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const effectiveLang = lang ?? DEFAULT_LANGUAGE;
  const to = hasSession
    ? localizedPath(effectiveLang, ROUTE_SEGMENTS.dashboard)
    : localizedPath(effectiveLang, ROUTE_SEGMENTS.signIn);

  return (
    <Link to={to} className={className}>
      {hasSession ? t("actions.goHome") : t("actions.goToSignIn")}
    </Link>
  );
}
