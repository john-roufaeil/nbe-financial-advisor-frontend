import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Accessibility, ChevronRight, X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { useDismissablePanel } from "@/lib/use-dismissable-panel";
import { Z_FLOATING_ACTION } from "@/lib/z-index";
import { useAccessibilityStore } from "@/store/use-accessibility-store";
import { useAccessibilityPeek } from "@/lib/use-accessibility-peek";
import { useA11yPanelPosition } from "@/lib/use-a11y-panel-position";
import { FontSizeControl } from "@/components/shared/preferences/FontSizeControl";
import { HighContrastToggle } from "@/components/shared/preferences/HighContrastToggle";

export function AccessibilityMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const peeking = useAccessibilityPeek();

  const fontScale = useAccessibilityStore((s) => s.fontScale);
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const increaseFontSize = useAccessibilityStore((s) => s.increaseFontSize);
  const decreaseFontSize = useAccessibilityStore((s) => s.decreaseFontSize);
  const setFontScale = useAccessibilityStore((s) => s.setFontScale);
  const resetFontSize = useAccessibilityStore((s) => s.resetFontSize);
  const toggleHighContrast = useAccessibilityStore((s) => s.toggleHighContrast);

  // Local, instant slider value — decoupled from the store so dragging doesn't
  // trigger a global font-size reflow on every pointermove tick.
  const [sliderValue, setSliderValue] = useState(fontScale);
  useEffect(() => setSliderValue(fontScale), [fontScale]);

  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--a11y-font-scale", String(fontScale));
    html.setAttribute("data-a11y-font-scale", "");
    html.classList.toggle("a11y-high-contrast", highContrast);
  }, [fontScale, highContrast]);

  const { position, reposition } = useA11yPanelPosition(
    open,
    triggerRef,
    panelRef,
    fontScale,
  );

  useDismissablePanel({
    open,
    onClose: () => setOpen(false),
    panelRef,
    triggerRef,
    reposition,
  });

  return (
    <div
      className={`a11y-panel fixed top-3/4 ${Z_FLOATING_ACTION} h-fit -translate-y-1/2`}
    >
      <div className="relative">
        <Tooltip content={t("settings.accessibility.menuLabel")} position="end">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={t("settings.accessibility.menuLabel")}
            className={`a11y-trigger btn btn-primary btn-square focus-visible:outline-primary/50 relative w-3 rounded-s-none rounded-e-md shadow-lg focus-visible:outline-4 focus-visible:outline-offset-2 ${peeking ? "a11y-trigger-peek" : ""}`}
          >
            <ChevronRight aria-hidden="true" className="a11y-trigger-hint size-3" />
            <Accessibility className="size-5" />
          </button>
        </Tooltip>

        {open &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={t("settings.accessibility.menuLabel")}
              style={{ top: position.top, left: position.left }}
              className={`a11y-panel border-base-300 bg-base-100 animate-a11y-panel-in fixed ${Z_FLOATING_ACTION} max-h-[80vh] w-72 max-w-[90vw] overflow-y-auto rounded-xl border p-4 shadow-2xl`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Accessibility className="text-primary size-4" />
                  {t("settings.accessibility.title")}
                </h2>
                <Tooltip content={t("settings.accessibility.close")}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    aria-label={t("settings.accessibility.close")}
                    className="btn btn-ghost btn-xs btn-square"
                  >
                    <X data-no-flip className="size-4" />
                  </button>
                </Tooltip>
              </div>

              <FontSizeControl
                fontScale={fontScale}
                sliderValue={sliderValue}
                onSliderChange={setSliderValue}
                onCommit={setFontScale}
                onIncrease={increaseFontSize}
                onDecrease={decreaseFontSize}
                onReset={resetFontSize}
              />

              <HighContrastToggle checked={highContrast} onToggle={toggleHighContrast} />
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
