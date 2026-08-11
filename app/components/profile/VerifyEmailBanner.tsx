import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, X } from "lucide-react";
import { useRequestEmailVerification } from "@/queries/auth";
import { Button } from "@/components/shared/Button";

/**
 * Prompt to (re)send the verification email. Session-only dismiss (not
 * persisted) rather than gone-forever, since an unverified user closing it
 * once shouldn't lose the option permanently.
 * Caller (profile.tsx) is responsible for not rendering this at all once
 * `user.email_verified` is true, or for a bank-login account
 * (`!user.has_password`) — that identity was already proven by bank OTP, so
 * an email-verification nudge doesn't apply regardless of email_verified
 * (bank-login never sends that email, so it would otherwise stay false
 * forever).
 */
export function VerifyEmailBanner() {
  const { t } = useTranslation();
  const requestVerification = useRequestEmailVerification();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="alert border-base-300 bg-base-100 animate-entry items-start gap-3 border shadow-sm sm:items-center">
      <Mail className="text-primary size-5 shrink-0" />
      <span className="flex-1 text-sm">{t("common.verifyEmail.message")}</span>
      <Button
        type="button"
        onClick={() => requestVerification.mutate()}
        loading={requestVerification.isPending}
        className="btn btn-primary btn-sm"
      >
        {t("common.verifyEmail.send")}
      </Button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="btn btn-ghost btn-sm btn-square"
        aria-label={t("actions.close")}
      >
        <X data-no-flip className="size-4" />
      </button>
    </div>
  );
}
