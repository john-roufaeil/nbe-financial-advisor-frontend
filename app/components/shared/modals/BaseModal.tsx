import { forwardRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { closeDialog } from "@/lib/close-dialog";

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
  /**
   * Set false to make this a true gate: no header X, no backdrop-click
   * dismiss, and Escape is swallowed (the native `<dialog>` `cancel` event is
   * prevented). The only way out is whatever `actions` does — e.g. a submit
   * handler that calls the imperative `close()`/`showModal()` ref itself.
   * Defaults true (every other modal in the app).
   */
  dismissible?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Shared shell for every dialog in the app: fixed header, a body that scrolls
 * on its own so the box never grows past the `.modal-box` 75vh cap, and an
 * optional footer for actions. All modals share the same width via the
 * `.modal-box` max-width rule in app.css.
 */
export const BaseModal = forwardRef<HTMLDialogElement, BaseModalProps>(function BaseModal(
  {
    title,
    icon,
    onClose,
    actions,
    actionsStart,
    dismissible = true,
    className,
    children,
  },
  ref,
) {
  const { t } = useTranslation();

  function handleClose() {
    onClose?.();
    closeDialog(ref);
  }

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onCancel={(e) => {
        // Native `<dialog>` fires `cancel` (then `close`) on Escape — block
        // it here so a gated modal can't be dismissed by keyboard either.
        if (!dismissible) e.preventDefault();
      }}
    >
      <div
        className={`modal-box relative isolate flex max-h-[75vh] flex-col gap-0 p-0 ${className ?? ""}`}
      >
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="flex flex-1 items-center gap-3">
            {icon}
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
          </div>
          {dismissible && (
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
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {actions && (
          // Not `sticky`: modal-box itself never scrolls (only the content div
          // above does, independently), so sticky positioning here was inert —
          // it just sits at the flex column's end regardless. Worse, Chromium
          // has a compositing quirk where a `position: sticky` element can
          // visually paint above a later `position: fixed` sibling (e.g. a
          // category picker's portaled menu) even though hit-testing still
          // correctly resolves clicks to the menu — a static footer avoids
          // that compositor promotion entirely.
          <div className="modal-action border-base-200 bg-base-100 mt-0 items-center justify-between border-t p-4">
            <div>{actionsStart}</div>
            <div className="flex flex-row-reverse items-center gap-2">{actions}</div>
          </div>
        )}
      </div>
      {dismissible && (
        <form method="dialog" className="modal-backdrop">
          <button className="cursor-default">{t("actions.close")}</button>
        </form>
      )}
    </dialog>
  );
});
