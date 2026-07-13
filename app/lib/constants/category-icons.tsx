import {
  Home,
  UtensilsCrossed,
  Car,
  Apple,
  Drama,
  Wrench,
  PiggyBank,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import type { ComponentType } from "react";
import type { TRANSACTION_CATEGORIES } from "@/types/transaction";

/** One fixed icon per budget category — unlike CATEGORY_COLOR_VARS (positional,
 * any category list order), this is keyed by name so a category keeps the same
 * icon regardless of where it sorts in a given view. */
export const CATEGORY_ICONS: Record<
  (typeof TRANSACTION_CATEGORIES)[number],
  ComponentType<{ className?: string; "data-no-flip"?: boolean }>
> = {
  Housing: Home,
  Rent: Home,
  Groceries: Apple,
  Entertainment: Drama,
  Utilities: Wrench,
  Food: UtensilsCrossed,
  Transportation: Car,
  Savings: PiggyBank,
  Lifestyle: Sparkles,
  Other: MoreHorizontal,
};

/** Falls back to the "other" glyph for any value outside the known six (e.g.
 * stale/mismatched data), rather than rendering nothing. */
export function categoryIcon(category: string) {
  return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? MoreHorizontal;
}
