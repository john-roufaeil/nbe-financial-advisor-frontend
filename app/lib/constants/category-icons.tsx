import {
  Home,
  UtensilsCrossed,
  Car,
  PiggyBank,
  Sparkles,
  CircleEllipsis,
  Banknote,
  ArrowLeftRight,
} from "lucide-react";
import type { ComponentType } from "react";

type CategoryIcon = ComponentType<{ className?: string; "data-no-flip"?: boolean }>;

/** One fixed icon per category `name` from GET /categories — unlike the color
 * palette (positional over the fetched taxonomy), this is keyed by name so a
 * category keeps the same icon regardless of where it sorts in a given view. */
export const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  // Expense taxonomy
  housing: Home,
  food: UtensilsCrossed,
  transport: Car,
  savings: PiggyBank,
  lifestyle: Sparkles,
  other: CircleEllipsis,
  // Income taxonomy
  salary: Banknote,
  transfers_in: ArrowLeftRight,
  other_income: CircleEllipsis,
};

/** Case-insensitive, with the "other" glyph for any value outside the known
 * taxonomy (e.g. stale/mismatched data), rather than rendering nothing. */
export function categoryIcon(category: string): CategoryIcon {
  return CATEGORY_ICONS[category.toLowerCase()] ?? CircleEllipsis;
}
