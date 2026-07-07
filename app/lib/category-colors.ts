/** Fixed categorical color order — never reassigned per-filter, so a category always maps to the same hue across the app. */
export const CATEGORY_BAR_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-info",
  "bg-success",
  "bg-warning",
];

/** Same fixed order as CATEGORY_BAR_COLORS, as CSS color values for use outside Tailwind classes (SVG/canvas). */
export const CATEGORY_COLOR_VARS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-accent)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
];
