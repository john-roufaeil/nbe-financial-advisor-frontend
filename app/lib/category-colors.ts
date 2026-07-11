import { useAccessibilityStore } from "@/store/use-accessibility-store";

/** Fixed categorical color order — never reassigned per-filter, so a category always maps to the same hue across the app. */
export const CATEGORY_BAR_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-info",
  "bg-success",
  "bg-warning",
];

/** Fixed categorical colors for pie/donut charts (SVG stroke values, not Tailwind
 * classes) — a wider 10-color palette than CATEGORY_BAR_COLORS so charts with
 * more categories than that still get a distinct hue per slice. Also used
 * (via inline style, not the Tailwind classes above) anywhere a bar or dot
 * needs to match a pie slice exactly, e.g. the budget allocations widget. */
export const CATEGORY_COLOR_VARS = [
  "oklch(40% 0.05 155)", // 1. Primary
  "oklch(80% 0.15 65)", // 2. Secondary
  "oklch(40% 0.02 250)", // 3. Accent
  "oklch(70% 0.12 220)", // 4. Info
  "oklch(60% 0.18 25)", // 5. Error
  "oklch(65% 0.15 145)", // 6. Success
  "oklch(80% 0.15 85)", // 7. Warning
  "oklch(50% 0.12 300)", // 8. Deep Purple (Theme-consistent)
  "oklch(75% 0.10 180)", // 9. Bright Teal (Theme-consistent)
  "oklch(65% 0.15 15)", // 10. Vibrant Rose (Theme-consistent)
];

export const CATEGORY_COLOR_VARS_HIGH_CONTRAST = [
  "oklch(25% 0.08 155)", // 1. Primary (Darkened)
  "oklch(90% 0.22 65)", // 2. Secondary (Vividly Bright)
  "oklch(25% 0.05 250)", // 3. Accent (Deepened)
  "oklch(85% 0.18 220)", // 4. Info (High-Luminescence Blue)
  "oklch(55% 0.28 25)", // 5. Error (Maximum Intensity Red)
  "oklch(60% 0.25 145)", // 6. Success (Deep Saturated Green)
  "oklch(90% 0.22 85)", // 7. Warning (High-Luminescence Yellow)
  "oklch(30% 0.18 300)", // 8. Deep Purple (Darkened for Contrast)
  "oklch(85% 0.15 180)", // 9. Bright Teal (Neon-esque)
  "oklch(55% 0.26 15)", // 10. Vibrant Rose (Max Intensity)
];

/** Picks CATEGORY_COLOR_VARS or its high-contrast counterpart based on the
 * user's accessibility setting — the single place any chart/dot/bar using
 * these SVG-style color values should read from, so nothing needs its own
 * highContrast branching. */
export function useCategoryColorVars() {
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  return highContrast ? CATEGORY_COLOR_VARS_HIGH_CONTRAST : CATEGORY_COLOR_VARS;
}
