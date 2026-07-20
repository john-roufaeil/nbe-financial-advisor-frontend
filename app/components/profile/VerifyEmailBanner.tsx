import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, X } from "lucide-react";
import { useRequestEmailVerification } from "@/queries/auth";
import { Button } from "@/components/shared/Button";

/**
 * Prompt to (re)send the verification email. There's no way to know from
 * the frontend whether the current user's email is already verified —
 * GET /users/me/ doesn't expose `email_verified` — so this can't hide itself
 * once verified; it's a discoverable action, not a status indicator.
 * Session-only dismiss (not persisted) rather than gone-forever, since an
 * unverified user closing it once shouldn't lose the option permanently.
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
