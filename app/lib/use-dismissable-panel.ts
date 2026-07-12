import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Wires up the standard "dismissable floating panel" behavior shared by
 * portal-based menus (AccessibilityMenu, PreferencesMenu, DataToolbar filters,
 * EntityPicker): Escape closes it (and returns focus to the trigger), clicking
 * outside both the panel and its trigger closes it, window resize/scroll
 * re-run the caller's positioning logic, and Tab is trapped inside the panel
 * so keyboard users can't tab past it into the page content behind it.
 */
export function useDismissablePanel({
  open,
  onClose,
  panelRef,
  triggerRef,
  reposition,
}: {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  reposition?: () => void;
}) {
  // Callers often pass inline arrow functions for onClose/reposition, which
  // get a new identity every render. Read them via refs so the effect below
  // only depends on open/panelRef/triggerRef and doesn't tear down and
  // re-run (re-firing reposition -> setState -> re-render) on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const repositionRef = useRef(reposition);
  repositionRef.current = reposition;

  useEffect(() => {
    if (!open) return;

    repositionRef.current?.();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        triggerRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable =
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    function onClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        onCloseRef.current();
      }
    }

    function onWindowChange() {
      repositionRef.current?.();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [open, panelRef, triggerRef]);
}
