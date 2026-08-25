import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { GoHomeOrSignInLink } from "@/components/auth/GoHomeOrSignInLink";
import { usePageTitle } from "@/lib/use-page-title";
import { useSyncHtmlDir } from "@/lib/use-sync-html-dir";
import { useCanGoBack } from "@/lib/use-can-go-back";
import { useConfirmEmailVerification } from "@/queries/auth";
import { useAuthStore } from "@/store/use-auth-store";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

const REDIRECT_SECONDS = 4;

/**
 * Landing page for the verification email link
 * (`{FRONTEND_URL}/verify-email?t=<opaque ticket>`), unprefixed because the
 * backend has no locale context when composing it. `t` is a single-use
 * opaque ticket, not the raw user id/token — the backend resolves it
 * server-side (services/link_tickets.py).
 */
export default function VerifyEmail() {
  const { t, i18n } = useTranslation();
  usePageTitle(t("verifyEmail.title"));
  useSyncHtmlDir();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const [searchParams] = useSearchParams();
  const confirmMutation = useConfirmEmailVerification();
  const [status, setStatus] = useState<"pending" | "success" | "invalid">("pending");
  const submitted = useRef(false);
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const ticket = searchParams.get("t");

  useEffect(() => {
    if (submitted.current) return;
    if (!ticket) {
      setStatus("invalid");
      return;
    }
    submitted.current = true;
    confirmMutation
      .mutateAsync({ t: ticket })
      .then(() => setStatus("success"))
      .catch(() => setStatus("invalid"));
  }, [ticket]);

  // Auto-redirect a few seconds after a successful verification, with a
  // visible countdown, rather than leaving the user stranded on a success
  // page with nothing to do but click a button.
  useEffect(() => {
    if (status !== "success") return;
    setSecondsLeft(REDIRECT_SECONDS);
    const lang = SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
      ? (i18n.language as SupportedLanguage)
      : DEFAULT_LANGUAGE;
    const interval = setInterval(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);
    const timeout = setTimeout(() => {
      navigate(
        localizedPath(
          lang,
          hasSession ? ROUTE_SEGMENTS.dashboard : ROUTE_SEGMENTS.signIn,
        ),
        { replace: true },
      );
    }, REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, hasSession, i18n.language, navigate]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        {status === "pending" && (
          <>
            <span className="loading loading-spinner loading-lg" />
            <p className="text-base-content/70">{t("verifyEmail.pending")}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="text-success size-12" />
            <h1 className="text-xl font-semibold">{t("verifyEmail.successTitle")}</h1>
            <p className="text-base-content/70">{t("verifyEmail.successMessage")}</p>
            <p className="text-base-content/50 text-sm" role="status">
              {t("verifyEmail.redirecting", { seconds: Math.max(0, secondsLeft) })}
            </p>
            <GoHomeOrSignInLink className="btn btn-primary" />
          </>
        )}
        {status === "invalid" && (
          <>
            <XCircle className="text-error size-12" />
            <h1 className="text-xl font-semibold">{t("verifyEmail.invalidTitle")}</h1>
            <p className="text-base-content/70">{t("verifyEmail.invalidMessage")}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={!canGoBack}
                className="btn btn-ghost bg-base-200"
              >
                {t("verifyEmail.goBack")}
              </button>
              <GoHomeOrSignInLink className="btn btn-primary" />
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
