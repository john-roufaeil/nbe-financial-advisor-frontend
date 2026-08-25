import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { useGrantConsent } from "@/queries/consent";
import { CURRENT_POLICY_VERSION } from "@/types/consent";
import { Button } from "@/components/shared/Button";
import { PrivacyPolicyModal } from "@/components/shared/modals/PrivacyPolicyModal";

/**
 * Stands in for whatever needs data_processing consent (core/permissions.py's
 * HasDataProcessingConsent) — the chat composer, the statement-upload
 * dropzone — replacing it entirely rather than covering it, so without
 * consent the blocked control is never rendered (or reachable by tab) at
 * all. Callers branch between this and the real content on useConsentStatus.
 */
export function ConsentRequiredOverlay({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const grant = useGrantConsent();
  const policyRef = useRef<HTMLDialogElement>(null);

  return (
    <div
      className={`border-base-300 bg-base-200/20 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center ${className}`}
    >
      <span className="bg-warning/10 text-warning grid size-11 place-items-center rounded-full">
        <Lock className="size-5" />
      </span>
      <p className="text-base-content/70 w-4/5 text-sm text-balance">
        {t("consent.requiredOverlay.message")}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => policyRef.current?.showModal()}
        >
          {t("consent.requiredOverlay.readPolicy")}
        </button>
        <Button
          type="button"
          className="btn btn-primary btn-sm"
          loading={grant.isPending}
          onClick={() =>
            grant.mutate({
              consentType: "data_processing",
              policyVersion: CURRENT_POLICY_VERSION,
            })
          }
        >
          {t("consent.requiredOverlay.action")}
        </Button>
      </div>
      <PrivacyPolicyModal ref={policyRef} type="data_processing" />
    </div>
  );
}
