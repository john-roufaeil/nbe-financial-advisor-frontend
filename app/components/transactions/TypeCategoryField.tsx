import { useTranslation } from "react-i18next";
import { useCategoriesForType } from "@/queries/categories";
import { categoryIcon } from "@/lib/constants/category-icons";
import { SimpleSelect } from "@/components/shared/forms/SimpleSelect";

/** SimpleSelect renders `label` as plain text with no per-option className hook,
 * so category names are capitalized here at the string level rather than via CSS. */
function capitalizeFirst(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Per-size classes: the transaction form uses the sm variant, the denser
 * extracted-statement rows the xs one. */
const SIZES = {
  sm: {
    row: "flex items-center gap-3",
    join: "join border-base-300 w-fit shrink-0 rounded-lg border",
    btn: "btn btn-sm join-item cursor-pointer",
    triggerSize: "sm",
  },
  xs: {
    row: "flex items-center gap-2",
    join: "join border-base-300 shrink-0 rounded-lg border",
    btn: "btn btn-xs join-item cursor-pointer",
    triggerSize: "xs",
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
  disableType = false,
  error,
  ariaDescribedBy,
}: {
  type: "income" | "expense";
  category: string;
  /** Receives the clicked type plus the category to fall back to — or null
   * when the current category carries over unchanged. */
  onTypeChange: (next: "income" | "expense", fallbackCategory: string | null) => void;
  onCategoryChange: (category: string) => void;
  size?: keyof typeof SIZES;
  /** Locks the expense/income toggle while leaving the category select
   * interactive — for a synced transaction, whose direction mirrors the
   * bank's own record and isn't user-editable. */
  disableType?: boolean;
  /** The expense/income toggle can't be invalid (always one of two fixed
   * values) — only the category select can, so these apply to it alone. */
  error?: boolean;
  ariaDescribedBy?: string;
}) {
  const { t } = useTranslation();
  const classes = SIZES[size];
  const expenseCategories = useCategoriesForType("expense");
  const incomeCategories = useCategoriesForType("income");
  const categoryOptions = type === "income" ? incomeCategories : expenseCategories;
  const categoryNamespace = type === "income" ? "incomeCategories" : "categories";

  function changeType(next: "income" | "expense") {
    const nextOptions = next === "income" ? incomeCategories : expenseCategories;
    const carriesOver = nextOptions.some((c) => c.name === category);
    onTypeChange(next, carriesOver ? null : (nextOptions[0]?.name ?? null));
  }

  return (
    <div className={classes.row}>
      <div className={classes.join}>
        <button
          type="button"
          onClick={() => changeType("expense")}
          disabled={disableType}
          className={`${classes.btn} ${type === "expense" ? "btn-error" : "btn-ghost"}`}
        >
          {t("common.filters.expense")}
        </button>
        <button
          type="button"
          onClick={() => changeType("income")}
          disabled={disableType}
          className={`${classes.btn} ${type === "income" ? "btn-success" : "btn-ghost"}`}
        >
          {t("common.filters.income")}
        </button>
      </div>
      <SimpleSelect
        value={category}
        onChange={onCategoryChange}
        triggerSize={classes.triggerSize}
        className="flex-1"
        error={error}
        ariaDescribedBy={ariaDescribedBy}
        options={categoryOptions.map((c) => ({
          value: c.name,
          label: capitalizeFirst(t(`common.${categoryNamespace}.${c.name}`, c.label)),
          icon: categoryIcon(c.name),
        }))}
      />
    </div>
  );
}
