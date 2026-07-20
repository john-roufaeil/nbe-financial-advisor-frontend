import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { GoHomeOrSignInLink } from "@/components/auth/GoHomeOrSignInLink";
import { usePageTitle } from "@/lib/use-page-title";
import { useSyncHtmlDir } from "@/lib/use-sync-html-dir";
import { useCanGoBack } from "@/lib/use-can-go-back";
import { useConfirmEmailVerification } from "@/queries/auth";

/**
 * Landing page for the verification email link
 * (`{FRONTEND_URL}/verify-email?t=<opaque ticket>`) — reachable both
 * unprefixed (what the emailed link actually points to; the backend has no
 * locale context when composing it, so it can't target `/en/...`/`/ar/...`)
 * and as `:lang/verify-email` (routes.ts), so a user already browsing the
 * app in a given language, or who switches language while here, gets a URL
 * consistent with the rest of the app. `t` is a single-use opaque ticket,
 * not the raw user id/token — the backend resolves it server-side
 * (services/link_tickets.py).
 */
export default function VerifyEmail() {
  const { t } = useTranslation();
  usePageTitle(t("verifyEmail.title"));
  useSyncHtmlDir();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const { lang } = useParams<{ lang: string }>();
  const [searchParams] = useSearchParams();
  const confirmMutation = useConfirmEmailVerification();
  const [status, setStatus] = useState<"pending" | "success" | "invalid">("pending");
  const submitted = useRef(false);

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
            <GoHomeOrSignInLink lang={lang} className="btn btn-primary" />
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
              <GoHomeOrSignInLink lang={lang} className="btn btn-primary" />
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
