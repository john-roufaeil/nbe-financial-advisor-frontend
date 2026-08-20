import { forwardRef, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { PrivacyPolicyModal } from "@/components/shared/modals/PrivacyPolicyModal";
import { PrivacyConsentToggles } from "@/components/profile/PrivacyConsentToggles";
import type { ConsentType } from "@/types/consent";

/**
 * Profile page's "Privacy & consent" entry point — a modal (not inline
 * toggles) so there's room to also link out to each type's own legal text
 * (PrivacyPolicyModal) next to its toggle, not just a bare on/off switch.
 * `viewingType` tracks which row's "View policy text" was clicked, since
 * the nested policy modal is one shared instance that swaps its content
 * rather than one instance per type.
 */
export const ConsentModal = forwardRef<HTMLDialogElement>(
  function ConsentModal(_props, ref) {
    const { t } = useTranslation();
    const policyRef = useRef<HTMLDialogElement>(null);
    const [viewingType, setViewingType] = useState<ConsentType>("terms_of_service");

    return (
      <>
        <BaseModal
          ref={ref}
          title={t("settings.accountManagement.consent.title")}
          icon={
            <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
              <ShieldCheck className="size-4.5" />
            </span>
          }
        >
          <div className="flex flex-col gap-2">
            <p className="text-base-content/60 text-sm">
              {t("settings.accountManagement.consent.description")}
            </p>
            <ul className="divide-base-300 flex flex-col divide-y">
              <PrivacyConsentToggles
                onViewPolicy={(type) => {
                  setViewingType(type);
                  policyRef.current?.showModal();
                }}
              />
            </ul>
          </div>
        </BaseModal>
        <PrivacyPolicyModal ref={policyRef} type={viewingType} />
      </>
    );
  },
);
