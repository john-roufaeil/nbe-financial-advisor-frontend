import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Accessibility, Minus, Plus, RotateCcw, Contrast, X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { useDismissablePanel } from "@/lib/use-dismissable-panel";
import { Z_FLOATING_ACTION } from "@/lib/z-index";
import {
  useAccessibilityStore,
  ACCESSIBILITY_LIMITS,
} from "@/store/use-accessibility-store";

const PANEL_GAP = 8;
const VIEWPORT_PADDING = 8;

export function AccessibilityMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const fontScale = useAccessibilityStore((s) => s.fontScale);
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const increaseFontSize = useAccessibilityStore((s) => s.increaseFontSize);
  const decreaseFontSize = useAccessibilityStore((s) => s.decreaseFontSize);
  const setFontScale = useAccessibilityStore((s) => s.setFontScale);
  const resetFontSize = useAccessibilityStore((s) => s.resetFontSize);
  const toggleHighContrast = useAccessibilityStore((s) => s.toggleHighContrast);

  const { MIN_SCALE, MAX_SCALE, DEFAULT_SCALE } = ACCESSIBILITY_LIMITS;

  // Local, instant slider value — decoupled from the store so dragging doesn't
  // trigger a global font-size reflow on every pointermove tick.
  const [sliderValue, setSliderValue] = useState(fontScale);
  useEffect(() => setSliderValue(fontScale), [fontScale]);

  const fontPercent = Math.round((sliderValue / DEFAULT_SCALE) * 100);

  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--a11y-font-scale", String(fontScale));
    html.setAttribute("data-a11y-font-scale", "");
    html.classList.toggle("a11y-high-contrast", highContrast);
  }, [fontScale, highContrast]);

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
  }, []);

  useDismissablePanel({
    open,
    onClose: () => setOpen(false),
    panelRef,
    triggerRef,
    reposition,
  });

  // The panel's own height changes with font scale (its text grows too), so
  // re-clamp its position after the resulting layout settles.
  useEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition, fontScale]);

  return (
    <div
      className={`a11y-panel fixed top-1/2 ${Z_FLOATING_ACTION} h-fit -translate-y-1/2`}
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
            className="btn btn-primary btn-square focus-visible:outline-primary/50 rounded-s-none rounded-e-md shadow-lg focus-visible:outline-4 focus-visible:outline-offset-2"
          >
            <Accessibility data-no-flip className="size-5" />
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
                  <Accessibility data-no-flip className="text-primary size-4" />
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

              <div className="border-base-300 bg-base-200/50 rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("settings.accessibility.fontSize")}
                  </span>
                  <span className="text-base-content/60 text-xs tabular-nums">
                    {fontPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip content={t("settings.accessibility.decreaseFontSize")}>
                    <button
                      type="button"
                      onClick={decreaseFontSize}
                      disabled={fontScale <= MIN_SCALE}
                      aria-label={t("settings.accessibility.decreaseFontSize")}
                      className="btn btn-outline btn-square btn-sm"
                    >
                      <Minus data-no-flip className="size-4" />
                    </button>
                  </Tooltip>
                  <input
                    type="range"
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={0.2}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    onPointerUp={(e) => setFontScale(Number(e.currentTarget.value))}
                    onKeyUp={(e) => setFontScale(Number(e.currentTarget.value))}
                    aria-label={t("settings.accessibility.fontSize")}
                    className="range range-primary range-sm flex-1 cursor-grab active:cursor-grabbing"
                  />
                  <Tooltip content={t("settings.accessibility.increaseFontSize")}>
                    <button
                      type="button"
                      onClick={increaseFontSize}
                      disabled={fontScale >= MAX_SCALE}
                      aria-label={t("settings.accessibility.increaseFontSize")}
                      className="btn btn-outline btn-square btn-sm"
                    >
                      <Plus data-no-flip className="size-4" />
                    </button>
                  </Tooltip>
                </div>
                <button
                  type="button"
                  onClick={resetFontSize}
                  disabled={fontScale === DEFAULT_SCALE}
                  className="btn btn-ghost btn-xs mt-2 gap-1.5"
                >
                  <RotateCcw data-no-flip className="size-3.5" />
                  {t("settings.accessibility.resetFontSize")}
                </button>
              </div>

              <label className="border-base-300 bg-base-200/50 mt-3 flex cursor-pointer items-center justify-between rounded-lg border p-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Contrast data-no-flip className="size-4" />
                  {t("settings.accessibility.highContrast")}
                </span>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                  className="toggle toggle-primary"
                  aria-label={t("settings.accessibility.highContrast")}
                />
              </label>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
