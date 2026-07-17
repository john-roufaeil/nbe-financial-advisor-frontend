import { delay } from "@/mocks/shared";
import type { Category } from "@/types/category";

/** Mirrors the backend's seeded taxonomy (core/migrations/0011_category.py),
 * in the same (category_type, name) order GET /categories returns. */
const categories: Category[] = [
  { id: "cat-food", name: "food", label: "Food", type: "expense", isFallback: false },
  {
    id: "cat-housing",
    name: "housing",
    label: "Housing",
    type: "expense",
    isFallback: false,
  },
  {
    id: "cat-lifestyle",
    name: "lifestyle",
    label: "Lifestyle",
    type: "expense",
    isFallback: false,
  },
  { id: "cat-other", name: "other", label: "Other", type: "expense", isFallback: true },
  {
    id: "cat-savings",
    name: "savings",
    label: "Savings",
    type: "expense",
    isFallback: false,
  },
  {
    id: "cat-transport",
    name: "transport",
    label: "Transport",
    type: "expense",
    isFallback: false,
  },
  {
    id: "cat-other-income",
    name: "other_income",
    label: "Other Income",
    type: "income",
    isFallback: true,
  },
  {
    id: "cat-salary",
    name: "salary",
    label: "Salary",
    type: "income",
    isFallback: false,
  },
  {
    id: "cat-transfers-in",
    name: "transfers_in",
    label: "Transfers In",
    type: "income",
    isFallback: false,
  },
];

export function getCategories(): Promise<Category[]> {
  return delay(categories);
}
