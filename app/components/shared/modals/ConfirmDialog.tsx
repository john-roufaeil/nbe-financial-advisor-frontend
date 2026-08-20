import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { useConfirmStore } from "@/store/use-confirm-store";
import { BaseModal } from "@/components/shared/modals/BaseModal";

export function ConfirmDialog() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const { isOpen, title, message, onConfirm, confirmLabel, tone, close } =
    useConfirmStore();
  const isDanger = tone !== "default";

  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);

  function handleConfirm() {
    onConfirm();
    close();
  }

  return (
    <BaseModal
      ref={ref}
      onClose={close}
      title={title}
      icon={
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full ${
            isDanger ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
          }`}
        >
          <TriangleAlert className="size-5" />
        </span>
      }
      actions={
        <>
          <button
            type="button"
            onClick={handleConfirm}
            className={`btn ${isDanger ? "btn-error" : "btn-primary"}`}
          >
            {confirmLabel ?? t("confirm.delete")}
          </button>
          <button type="button" onClick={close} className="btn btn-ghost">
            {t("actions.cancel")}
          </button>
        </>
      }
    >
      {message && <p className="text-base-content/60 text-sm">{message}</p>}
    </BaseModal>
  );
}
