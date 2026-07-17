import { delay } from "@/mocks/shared";
import type { Category } from "@/types/category";

/** Mirrors the backend's seeded taxonomy (core/migrations/0011_category.py),
 * in the same (category_type, name) order GET /categories returns. */
const categories: Category[] = [
  { name: "food", label: "Food", type: "expense", isFallback: false },
  { name: "housing", label: "Housing", type: "expense", isFallback: false },
  { name: "lifestyle", label: "Lifestyle", type: "expense", isFallback: false },
  { name: "other", label: "Other", type: "expense", isFallback: true },
  { name: "savings", label: "Savings", type: "expense", isFallback: false },
  { name: "transport", label: "Transport", type: "expense", isFallback: false },
  { name: "other_income", label: "Other Income", type: "income", isFallback: true },
  { name: "salary", label: "Salary", type: "income", isFallback: false },
  { name: "transfers_in", label: "Transfers In", type: "income", isFallback: false },
];

export function getCategories(): Promise<Category[]> {
  return delay(categories);
}
