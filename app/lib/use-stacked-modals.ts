import { useEffect } from "react";

/**
 * Native <dialog> modals stack in the top layer by the order showModal() was
 * called — an order CSS can't query. This watches every daisyUI `.modal` dialog
 * and tags the ones sitting *below* the topmost open modal with
 * `modal-stacked-below`, so they scale back a touch and stacked modals gain a
 * sense of depth. See the matching rule in app.css.
 */
export function useStackedModals() {
  useEffect(() => {
    const openOrder: HTMLDialogElement[] = [];

    function refresh() {
      const open = new Set(
        document.querySelectorAll<HTMLDialogElement>("dialog.modal[open]"),
      );
      // Drop modals that just closed, keeping the surviving open order intact.
      for (let i = openOrder.length - 1; i >= 0; i--) {
        if (!open.has(openOrder[i])) openOrder.splice(i, 1);
      }
      // Append newly opened modals in discovery order.
      for (const el of open) {
        if (!openOrder.includes(el)) openOrder.push(el);
      }
      const topIndex = openOrder.length - 1;
      openOrder.forEach((el, i) => {
        el.classList.toggle("modal-stacked-below", i < topIndex);
      });
    }

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    refresh();
    return () => observer.disconnect();
  }, []);
}
