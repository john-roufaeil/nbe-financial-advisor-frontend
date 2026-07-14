import { useTranslation } from "react-i18next";
import { categoriesForType } from "@/types/transaction";

/** Per-size classes: the transaction form uses the sm variant, the denser
 * extracted-statement rows the xs one. */
const SIZES = {
  sm: {
    row: "flex items-center gap-3",
    join: "join border-base-300 w-fit shrink-0 rounded-lg border",
    btn: "btn btn-sm join-item cursor-pointer",
    select: "select select-bordered select-sm w-full",
  },
  xs: {
    row: "flex items-center gap-2",
    join: "join border-base-300 shrink-0 rounded-lg border",
    btn: "btn btn-xs join-item cursor-pointer",
    select: "select select-bordered select-xs w-full",
  },
} as const;

/**
 * The expense/income toggle with its dependent category select. Owns the
 * category-fallback rule: switching type keeps the current category when it
 * also exists under the new type, otherwise reports the new type's first
 * category so the selection never dangles.
 */
export function TypeCategoryField({
  type,
  category,
  onTypeChange,
  onCategoryChange,
  size = "sm",
}: {
  type: "income" | "expense";
  category: string;
  /** Receives the clicked type plus the category to fall back to — or null
   * when the current category carries over unchanged. */
  onTypeChange: (next: "income" | "expense", fallbackCategory: string | null) => void;
  onCategoryChange: (category: string) => void;
  size?: keyof typeof SIZES;
}) {
  const { t } = useTranslation();
  const classes = SIZES[size];
  const categoryOptions = categoriesForType(type);
  const categoryNamespace = type === "income" ? "incomeCategories" : "categories";

  function changeType(next: "income" | "expense") {
    const nextOptions = categoriesForType(next);
    onTypeChange(next, nextOptions.includes(category) ? null : nextOptions[0]);
  }

  return (
    <div className={classes.row}>
      <div className={classes.join}>
        <button
          type="button"
          onClick={() => changeType("expense")}
          className={`${classes.btn} ${type === "expense" ? "btn-error" : "btn-ghost"}`}
        >
          {t("common.filters.expense")}
        </button>
        <button
          type="button"
          onClick={() => changeType("income")}
          className={`${classes.btn} ${type === "income" ? "btn-success" : "btn-ghost"}`}
        >
          {t("common.filters.income")}
        </button>
      </div>
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={classes.select}
      >
        {categoryOptions.map((c) => (
          <option key={c} value={c}>
            {t(`common.${categoryNamespace}.${c}`, c)}
          </option>
        ))}
      </select>
    </div>
  );
}
