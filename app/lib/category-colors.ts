import { useAccessibilityStore } from "@/store/use-accessibility-store";
import { useThemeStore } from "@/store/use-theme-store";

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
  "oklch(65% 0.13 300)", // 1. Deep Amethyst (Light theme variant of Deep Purple)
  "oklch(65% 0.10 180)", // 2. Ocean Teal (Light theme variant of Bright Teal)
  "oklch(60% 0.14 15)", // 3. Crimson Rose (Light theme variant of Vibrant Rose)
  "oklch(70% 0.14 75)", // 4. Burnt Gold
  "oklch(65% 0.13 40)", // 5. Deep Coral
  "oklch(60% 0.11 260)", // 6. Cobalt Blue
  "oklch(65% 0.11 135)", // 7. Jade Green
  "oklch(70% 0.13 340)", // 8. Berry Magenta
];

/** Same 10 hues as CATEGORY_COLOR_VARS, relit for dark surfaces — these are
 * plain oklch() literals (not var(--color-*) references), so unlike
 * CATEGORY_BAR_COLORS' daisyUI classes they don't pick up html.dark's
 * palette automatically and need their own explicit dark values. Lightness
 * lifted and chroma bumped a bit (mirroring the same fix applied to
 * --color-primary/--color-error in app.css) so slices read as solid,
 * distinct colors on the dark slate surfaces instead of washing out pale. */
export const CATEGORY_COLOR_VARS_DARK = [
  "oklch(75% 0.10 300)", // 1. Soft Amethyst (Dark theme variant of Deep Purple)
  "oklch(80% 0.08 180)", // 2. Muted Teal (Dark theme variant of Bright Teal)
  "oklch(75% 0.12 15)", // 3. Dusky Rose (Dark theme variant of Vibrant Rose)
  "oklch(82% 0.12 85)", // 4. Warm Gold (Dark theme variant of Warning/Amber)
  "oklch(76% 0.12 45)", // 5. Soft Coral
  "oklch(78% 0.10 260)", // 6. Periwinkle Blue
  "oklch(82% 0.09 130)", // 7. Pale Mint
  "oklch(78% 0.10 340)", // 8. Magenta Haze
];

/** High-contrast mode (see html.a11y-high-contrast in app.css) always forces
 * a white base surface regardless of light/dark theme, so this single set
 * covers both — no separate dark+high-contrast variant needed. */
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

/** Picks the right CATEGORY_COLOR_VARS_* palette for the user's current
 * accessibility + theme settings — the single place any chart/dot/bar using
 * these SVG-style color values should read from, so nothing needs its own
 * highContrast/theme branching. High contrast wins over theme since it
 * forces a white surface in both light and dark mode. */
export function useCategoryColorVars() {
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const theme = useThemeStore((s) => s.theme);
  if (highContrast) return CATEGORY_COLOR_VARS_HIGH_CONTRAST;
  return theme === "dark" ? CATEGORY_COLOR_VARS_DARK : CATEGORY_COLOR_VARS;
}
