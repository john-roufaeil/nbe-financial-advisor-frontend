import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { closeDialog } from "@/lib/close-dialog";
import type { ConsentType } from "@/types/consent";

/**
 * Full legal text for one consent type — terms_of_service and
 * data_processing have their own distinct content (consent.policies.*),
 * shown from both the onboarding consent checkboxes and the profile page's
 * ConsentModal so there's exactly one copy of each policy's wording.
 */
export const PrivacyPolicyModal = forwardRef<HTMLDialogElement, { type: ConsentType }>(
  function PrivacyPolicyModal({ type }, ref) {
    const { t } = useTranslation();
    return (
      <BaseModal
        ref={ref}
        title={t(`consent.policies.${type}.title`)}
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
          {t(`consent.policies.${type}.body`)}
        </p>
      </BaseModal>
    );
  },
);
