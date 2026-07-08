import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { useConfirmStore } from "@/store/use-confirm-store";

export function ConfirmDialog() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const { isOpen, title, message, onConfirm, close } = useConfirmStore();

  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);

  function handleConfirm() {
    onConfirm();
    close();
  }

  return (
    <dialog ref={ref} className="modal" onClose={close}>
      <div className="modal-box flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-error/10 text-error grid size-9 shrink-0 place-items-center rounded-full">
            <TriangleAlert className="size-5" />
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {message && <p className="text-base-content/60 text-sm">{message}</p>}
        <div className="modal-action">
          <button type="button" onClick={close} className="btn btn-ghost">
            {t("actions.cancel")}
          </button>
          <button type="button" onClick={handleConfirm} className="btn btn-error">
            {t("confirm.delete")}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button className="cursor-default">{t("actions.close")}</button>
      </form>
    </dialog>
  );
}
