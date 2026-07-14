import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { closeDialog } from "@/lib/close-dialog";

/** Terms & privacy policy content, shown from the onboarding consent step. */
export const PrivacyPolicyModal = forwardRef<HTMLDialogElement>(
  function PrivacyPolicyModal(_props, ref) {
    const { t } = useTranslation();
    return (
      <BaseModal
        ref={ref}
        title={t("consent.policyTitle")}
        actions={
          <button
            type="button"
            onClick={() => closeDialog(ref)}
            className="btn btn-primary btn-sm"
          >
            {t("actions.done")}
          </button>
        }
      >
        <p className="text-base-content/70 text-sm whitespace-pre-line">
          {t("consent.policyBody")}
        </p>
      </BaseModal>
    );
  },
);
