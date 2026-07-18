export interface Category {
  /** Stable machine key the whole API speaks (e.g. "housing") — transactions,
   * budget allocations, and analytics all reference categories by this value. */
  name: string;
  /** Backend's English display label — used as the i18n fallback when no
   * common.categories.* / common.incomeCategories.* key exists for `name`. */
  label: string;
  type: "income" | "expense";
  /** The bucket uncategorizable transactions resolve to (one per type). */
  isFallback: boolean;
}
