import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";
import { useTranslation } from "react-i18next";
import { Z_TOOLTIP } from "@/lib/z-index";
import { LoadingAnnouncement } from "@/components/shared/skeletons/LoadingAnnouncement";

/** Below this, a navigation feels instant — no point flashing a spinner badge for it. */
const SPINNER_DELAY_MS = 150;

/**
 * The only visual cue that a route transition is in flight: a glowing
 * top-of-viewport progress bar plus a small corner spinner badge for
 * transitions that run long enough to notice. Route chunks are lazy-loaded
 * (see routes.ts) and some routes have loaders, so a navigation can take
 * anywhere from a few ms to a couple of seconds with otherwise zero
 * feedback. Both are non-interactive (`aria-hidden`, `pointer-events-none`).
 *
 * Classic NProgress-style state machine: creep toward (not to) completion
 * while navigating, since the real duration is unknown; snap to 100% and
 * fade out once the navigation settles back to "idle".
 */
export function NavigationProgressBar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [showSpinner, setShowSpinner] = useState(false);
  const fadeTimer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);
  const spinnerTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isNavigating) {
      window.clearTimeout(fadeTimer.current);
      window.clearTimeout(resetTimer.current);
      setVisible(true);
      spinnerTimer.current = window.setTimeout(
        () => setShowSpinner(true),
        SPINNER_DELAY_MS,
      );
      // Defer to the next frame so the width transition (0 -> creep target)
      // actually animates instead of starting already at its end value.
      const raf = requestAnimationFrame(() => setWidth(85));
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(spinnerTimer.current);
      };
    }

    // Navigation just finished: snap to 100%, hold briefly, then fade out.
    window.clearTimeout(spinnerTimer.current);
    setShowSpinner(false);
    setWidth(100);
    fadeTimer.current = window.setTimeout(() => setVisible(false), 250);
    resetTimer.current = window.setTimeout(() => setWidth(0), 550);
    return () => {
      window.clearTimeout(fadeTimer.current);
      window.clearTimeout(resetTimer.current);
    };
  }, [isNavigating]);

  if (!visible && width === 0) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className={`bg-primary shadow-primary/60 fixed inset-x-0 top-0 h-1 ${Z_TOOLTIP} pointer-events-none shadow-[0_0_10px_2px] transition-opacity duration-250 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className="bg-primary h-full transition-[width] ease-out"
          style={{
            width: `${width}%`,
            transitionDuration: isNavigating ? "2200ms" : "250ms",
          }}
        />
      </div>

      {showSpinner && (
        <div
          aria-hidden="true"
          className={`bg-base-100 border-base-300 fixed inset-e-4 top-4 ${Z_TOOLTIP} pointer-events-none flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg`}
        >
          <span className="loading loading-spinner loading-xs text-primary" />
          <span className="text-base-content/70 text-xs font-medium">
            {t("common.loading")}
          </span>
        </div>
      )}
      {isNavigating && <LoadingAnnouncement />}
    </>
  );
}
