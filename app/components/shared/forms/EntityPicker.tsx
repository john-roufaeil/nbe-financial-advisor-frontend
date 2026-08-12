import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useDismissablePanel } from "@/lib/use-dismissable-panel";
import { Z_POPOVER } from "@/lib/z-index";

// Tailwind's build-time scanner needs literal class strings — `input-${size}`
// would silently drop input-xs/input-md from the compiled CSS since neither
// appears literally anywhere else the scanner walks.
const TRIGGER_SIZE_CLASSES = {
  xs: "input-xs",
  sm: "input-sm",
  md: "input-md",
} as const;

// How long a pause between keystrokes before type-ahead starts a fresh
// search instead of appending to the current one — matches native <select>.
const TYPEAHEAD_RESET_MS = 600;

export interface EntityPickerProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  /** Content of the collapsed trigger button (selected item preview or placeholder). */
  trigger: ReactNode;
  /** Content of each item row in the open list (logo, label, trailing check, etc). */
  renderItem: (item: T) => ReactNode;
  /** Extra classes for a row's button — e.g. a tinted background on the
   * currently-selected item, matching its trailing check indicator. */
  itemClassName?: (item: T) => string;
  disabled?: boolean;
  error?: boolean;
  /** id of an element (e.g. a field's error message) describing this picker
   * for screen readers — same wiring a plain input's aria-describedby would get. */
  ariaDescribedBy?: string;
  className?: string;
  ariaLabel?: string;
  /** daisyUI input size suffix for the trigger button — matches whatever
   * size the native `<select>` it replaces would have used. */
  triggerSize?: "xs" | "sm" | "md";
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
  itemClassName,
  disabled,
  error,
  ariaDescribedBy,
  className = "",
  ariaLabel,
  triggerSize = "sm",
  search,
  footer,
  emptyMessage,
  // Grows to fill the panel's available height (itself capped to remaining
  // viewport space, see updateCoords) rather than a fixed max-h — a short
  // list then renders with no scrollbar at all instead of an arbitrary gap.
  listClassName = "flex-1",
}: EntityPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  const typeaheadQueryRef = useRef("");
  const typeaheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WAI-ARIA listbox pattern requires arrow-key roving focus and type-ahead;
  // Tab already reaches each option, this adds Up/Down/Home/End plus jumping
  // by typed text (via textContent, since renderItem returns arbitrary nodes).
  const handleListKeyDown = useCallback((e: React.KeyboardEvent<HTMLUListElement>) => {
    const options = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>(
        ':scope > li[role="option"] > button',
      ),
    );
    if (options.length === 0) return;
    const activeIndex = options.indexOf(document.activeElement as HTMLButtonElement);

    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      e.preventDefault();
      const lastIndex = options.length - 1;
      const nextIndex =
        e.key === "ArrowDown"
          ? activeIndex < 0
            ? 0
            : Math.min(activeIndex + 1, lastIndex)
          : e.key === "ArrowUp"
            ? activeIndex <= 0
              ? 0
              : activeIndex - 1
            : e.key === "Home"
              ? 0
              : lastIndex;
      options[nextIndex].focus();
      return;
    }

    // e.key for Ctrl/Alt/Meta shortcuts is often still a printable char
    // (e.g. Ctrl+A -> "a"), so exclude them or they'd misfire type-ahead.
    if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

    if (typeaheadTimeoutRef.current) clearTimeout(typeaheadTimeoutRef.current);
    typeaheadQueryRef.current += e.key.toLowerCase();
    typeaheadTimeoutRef.current = setTimeout(() => {
      typeaheadQueryRef.current = "";
    }, TYPEAHEAD_RESET_MS);

    const query = typeaheadQueryRef.current;
    // Repeating one letter within the reset window cycles through matches
    // instead of sticking to the first: search from after the active option.
    const isRepeatedSingleChar =
      query.length > 1 && [...query].every((c) => c === query[0]);
    const effectiveQuery = isRepeatedSingleChar ? query[0] : query;
    const searchStart = isRepeatedSingleChar ? activeIndex + 1 : 0;

    const matchIndex = options
      .map((_, i) => (i + searchStart) % options.length)
      .find((i) =>
        options[i].textContent?.trim().toLowerCase().startsWith(effectiveQuery),
      );

    if (matchIndex !== undefined) {
      e.preventDefault();
      options[matchIndex].focus();
    }
  }, []);

  // Portal-rendered and positioned from the trigger's live rect so the menu
  // overlays the page (e.g. inside a modal) instead of adding scroll height.
  // maxHeight is the real remaining viewport space, not a fixed guess.
  const updateCoords = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const top = rect.bottom + 4;
    setCoords({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(160, window.innerHeight - top - 8),
    });
  }, []);

  useDismissablePanel({
    open: open && !disabled,
    onClose: close,
    panelRef,
    triggerRef,
    reposition: updateCoords,
  });

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          updateCoords();
          setOpen((v) => !v);
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy}
        className={`input input-bordered ${TRIGGER_SIZE_CLASSES[triggerSize]} relative flex w-full items-center justify-between gap-2 before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] ${error ? "input-error" : ""} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        {trigger}
        <ChevronDown data-no-flip className="size-4 shrink-0 opacity-50" />
      </button>

      {open &&
        !disabled &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="presentation"
            // Lets an ancestor panel's useDismissablePanel recognize this
            // portaled-elsewhere menu as "still inside" for click-outside
            // purposes — see use-dismissable-panel.ts.
            data-floating-menu=""
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              // Forces its own compositor layer immediately — Chromium's lazy
              // promotion otherwise leaves a stale, misordered layer when this
              // sits inside an open <dialog> (hit-testing is fine, paint isn't).
              transform: "translateZ(0)",
            }}
            // No entrance animation: animating transform/opacity here re-triggers
            // the same Chromium layer-ordering bug when nested in a <dialog>.
            className={`menu bg-base-100 border-base-300 fixed ${Z_POPOVER} flex-col flex-nowrap gap-1 overflow-hidden rounded-xl border p-2 shadow-lg`}
          >
            {search}
            <ul
              role="listbox"
              onKeyDown={handleListKeyDown}
              className={`${listClassName} min-h-0 overflow-y-auto`}
            >
              {items.map((item) => (
                <li key={getKey(item)} role="option">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      close();
                    }}
                    className={`hover:bg-base-200 focus-visible:outline-primary/50 relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-start text-sm before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 ${itemClassName?.(item) ?? ""}`}
                  >
                    {renderItem(item)}
                  </button>
                </li>
              ))}
              {items.length === 0 && emptyMessage && (
                <li className="text-base-content/50 px-2 py-1.5 text-sm">
                  {emptyMessage}
                </li>
              )}
            </ul>
            {footer?.(close)}
          </div>,
          // Native <dialog> content paints in the browser's top layer, above
          // everything else regardless of z-index — portal into the dialog
          // itself (not document.body) or the menu renders behind the modal.
          triggerRef.current?.closest("dialog") ?? document.body,
        )}
    </div>
  );
}
