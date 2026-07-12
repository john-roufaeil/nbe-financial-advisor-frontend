import { useEffect, useState } from "react";
import { useAccessibilityStore } from "@/store/use-accessibility-store";

export type LayoutTier = "desktop" | "laptop" | "mobile";

/** Matches the sidebar's existing `lg:` (1024px) breakpoint in AppLayout. */
const LAPTOP_WIDTH = 1024;
/** Matches AppLayout's mobile drawer breakpoint (below `lg:`). */
const MOBILE_WIDTH = 768;

/** In-app font scale (see useAccessibilityStore) at which the layout should
 * jump straight to the mobile (off-canvas drawer) treatment, even on a wide
 * desktop — because CSS `em`/`rem` media queries only track *native* browser
 * zoom/OS text size, not this app's own JS-driven font-scale slider. There is
 * no separate "laptop" font-scale threshold: 140%+ goes straight to mobile. */
const MOBILE_FONT_SCALE = 1.4;

function computeTier(width: number, fontScale: number): LayoutTier {
  if (width < MOBILE_WIDTH || fontScale >= MOBILE_FONT_SCALE) return "mobile";
  if (width < LAPTOP_WIDTH) return "laptop";
  return "desktop";
}

/**
 * Resolves the effective layout tier from viewport width AND the app's
 * accessibility font-scale, so a user who scales text up to 140%+ gets the
 * mobile (off-canvas drawer, hamburger-openable, no collapse/expand button)
 * layout regardless of how wide their actual screen is. ("laptop" is now
 * purely a width-only tier — a narrower-but-not-mobile desktop viewport —
 * since font-scale no longer produces a distinct laptop treatment.)
 *
 * Defaults to "desktop" during SSR/first paint (fontScale is only known
 * after the persisted store hydrates client-side, same tradeoff as the
 * theme's own flash-of-wrong-value handling) and corrects on mount.
 */
export function useLayoutTier(): LayoutTier {
  const fontScale = useAccessibilityStore((s) => s.fontScale);
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? LAPTOP_WIDTH : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return computeTier(width, fontScale);
}
