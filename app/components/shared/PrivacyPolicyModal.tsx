import { forwardRef } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Terms & privacy policy content, shown from the onboarding consent step. */
export const PrivacyPolicyModal = forwardRef<HTMLDialogElement>(
  function PrivacyPolicyModal(_props, ref) {
    const { t } = useTranslation();
    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box relative flex flex-col gap-4">
          <form method="dialog">
            <button
              className="btn btn-ghost btn-sm btn-circle absolute end-2 top-2"
              aria-label={t("actions.close")}
            >
              <X data-no-flip className="size-4" />
            </button>
          </form>
          <h3 className="text-lg font-semibold">{t("consent.policyTitle")}</h3>
          <p className="text-base-content/70 text-sm whitespace-pre-line">
            {t("consent.policyBody")}
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary btn-sm">{t("actions.done")}</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button className="cursor-default">{t("actions.close")}</button>
        </form>
      </dialog>
    );
  },
);
