import { useCallback, useEffect, useState, type RefObject } from "react";

const PANEL_GAP = 8;
const VIEWPORT_PADDING = 8;

/** Positions the accessibility panel next to its trigger, clamped to the viewport. */
export function useA11yPanelPosition(
  open: boolean,
  triggerRef: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  fontScale: number,
) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const reposition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const panelRect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isRtl = document.documentElement.dir === "rtl";
    const panelWidth = panelRect?.width ?? rect.width;
    const panelHeight = panelRect?.height ?? 0;

    // Prefer opening to the "end" side of the trigger (away from the screen
    // edge it's pinned to); clamp against both viewport edges so it can
    // never run off-screen, even at high zoom / narrow effective viewports.
    let left = isRtl ? rect.left - panelWidth - PANEL_GAP : rect.right + PANEL_GAP;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, window.innerWidth - panelWidth - VIEWPORT_PADDING),
    );

    let top = rect.top;
    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(top, window.innerHeight - panelHeight - VIEWPORT_PADDING),
    );

    setPosition({ top, left });
  }, [triggerRef, panelRef]);

  // The panel's own height changes with font scale (its text grows too), so
  // re-clamp its position after the resulting layout settles.
  useEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition, fontScale]);

  return { position, reposition };
}
