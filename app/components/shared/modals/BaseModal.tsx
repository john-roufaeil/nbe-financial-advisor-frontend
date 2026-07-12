import { forwardRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";

interface BaseModalProps {
  /** Modal heading. Optional so content-driven modals (e.g. bank statement detail) can render without one, but the close button always shows. */
  title?: ReactNode;
  /** Small icon shown before the title (e.g. a warning glyph on confirm dialogs). */
  icon?: ReactNode;
  /** Called in addition to the native `close()` when the header close button fires. */
  onClose?: () => void;
  /** Right-aligned footer buttons. Omit to render no footer at all. */
  actions?: ReactNode;
  /** Left-aligned footer content, e.g. a destructive action kept apart from actions. */
  actionsStart?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Shared shell for every dialog in the app: fixed header, a body that scrolls
 * on its own so the box never grows past the `.modal-box` 75vh cap, and an
 * optional sticky footer for actions. All modals share the same width via the
 * `.modal-box` max-width rule in app.css.
 */
export const BaseModal = forwardRef<HTMLDialogElement, BaseModalProps>(function BaseModal(
  { title, icon, onClose, actions, actionsStart, className, children },
  ref,
) {
  const { t } = useTranslation();

  function handleClose() {
    onClose?.();
    if (ref && "current" in ref) ref.current?.close();
  }

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div
        className={`modal-box relative flex max-h-[75vh] flex-col gap-0 p-0 ${className ?? ""}`}
      >
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="flex flex-1 items-center gap-3">
            {icon}
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
          </div>
          <Tooltip
            content={t("actions.close")}
            position="start"
            className="-me-2 shrink-0"
          >
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label={t("actions.close")}
            >
              <X data-no-flip className="size-4" />
            </button>
          </Tooltip>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {actions && (
          <div className="modal-action border-base-200 bg-base-100 sticky bottom-0 mt-0 items-center justify-between border-t p-4">
            <div>{actionsStart}</div>
            <div className="flex flex-row-reverse items-center gap-2">{actions}</div>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button className="cursor-default">{t("actions.close")}</button>
      </form>
    </dialog>
  );
});
