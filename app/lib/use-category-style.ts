import {
  CATEGORY_BAR_COLORS,
  useCategoryColorVars,
} from "@/lib/constants/category-colors";
import { categoryIcon } from "@/lib/constants/category-icons";
import { useCategories } from "@/queries/categories";

/** Deterministic fallback index for a name outside the fetched taxonomy, so
 * even stale/unknown categories keep one stable color across renders. */
function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/**
 * Name-keyed category styling — the one place any bar, dot, slice, or icon
 * should get its look from. A category's palette slot is its position in the
 * fetched taxonomy (GET /categories, stable (type, name) order), NOT its row
 * index in whatever list a view happens to render — so "food" is the same
 * color in the dashboard donut, the chat breakdown, and every legend.
 */
export function useCategoryStyle() {
  const { data: categories } = useCategories();
  const colorVars = useCategoryColorVars();

  function paletteIndex(name: string): number {
    const idx = categories?.findIndex((c) => c.name === name) ?? -1;
    return idx >= 0 ? idx : hashName(name);
  }

  return {
    /** Tailwind bg-* class for progress/bar fills. */
    barClass: (name: string) =>
      CATEGORY_BAR_COLORS[paletteIndex(name) % CATEGORY_BAR_COLORS.length],
    /** SVG/inline-style color value (theme- and a11y-aware). */
    color: (name: string) => colorVars[paletteIndex(name) % colorVars.length],
    /** Lucide icon component for the category. */
    icon: categoryIcon,
  };
}
