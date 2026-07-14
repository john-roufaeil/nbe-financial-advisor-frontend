import { useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useDismissablePanel } from "@/lib/use-dismissable-panel";
import { Z_DROPDOWN } from "@/lib/z-index";

export interface EntityPickerProps<T> {
  items: T[];
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  /** Content of the collapsed trigger button (selected item preview or placeholder). */
  trigger: ReactNode;
  /** Content of each item row in the open list (logo, label, trailing check, etc). */
  renderItem: (item: T) => ReactNode;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  /** Optional search input rendered above the list (e.g. BankPicker's bank search). */
  search?: ReactNode;
  /** Rendered below the list; receives `close` so actions can dismiss the dropdown. */
  footer?: (close: () => void) => ReactNode;
  emptyMessage?: ReactNode;
  listClassName?: string;
}

/**
 * Shared dropdown shell for single-select "entity" pickers (bank accounts,
 * banks, etc): a bordered trigger button that opens a scrollable list menu.
 * Callers own item shape/filtering/search state; this owns open/close,
 * the outside-click overlay, and the trigger/menu chrome.
 */
export function EntityPicker<T>({
  items,
  getKey,
  onSelect,
  trigger,
  renderItem,
  disabled,
  error,
  className = "",
  search,
  footer,
  emptyMessage,
  listClassName = "max-h-40",
}: EntityPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useDismissablePanel({
    open: open && !disabled,
    onClose: close,
    panelRef,
    triggerRef,
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input input-bordered input-sm relative flex w-full items-center justify-between gap-2 before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] ${error ? "input-error" : ""} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        {trigger}
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && !disabled && (
        <div
          ref={panelRef}
          className={`menu bg-base-100 border-base-300 absolute ${Z_DROPDOWN} mt-1 w-full flex-col gap-1 rounded-xl border p-2 shadow-lg`}
        >
          {search}
          <ul role="listbox" className={`${listClassName} overflow-y-auto`}>
            {items.map((item) => (
              <li key={getKey(item)} role="option">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    close();
                  }}
                  className="hover:bg-base-200 focus-visible:outline-primary/50 relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-start text-sm before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {renderItem(item)}
                </button>
              </li>
            ))}
            {items.length === 0 && emptyMessage && (
              <li className="text-base-content/50 px-2 py-1.5 text-sm">{emptyMessage}</li>
            )}
          </ul>
          {footer?.(close)}
        </div>
      )}
    </div>
  );
}
