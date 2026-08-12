import { useTranslation } from "react-i18next";
import { categoryIcon } from "@/lib/constants/category-icons";
import { useCategories } from "@/queries/categories";

/**
 * The one place a category name becomes on-screen text: its icon plus its
 * translated label. `type` picks the i18n namespace (income vs. expense
 * categories are translated separately) — pass it whenever the caller already
 * knows it (e.g. a transaction's own `type`); otherwise it's resolved from the
 * fetched taxonomy, defaulting to "expense" while that's still loading.
 */
export function CategoryLabel({
  category,
  type,
  className = "",
  iconClassName = "size-3.5 shrink-0 opacity-60",
}: {
  category: string;
  type?: "income" | "expense";
  className?: string;
  iconClassName?: string;
}) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const resolvedType =
    type ?? categories?.find((c) => c.name === category)?.type ?? "expense";
  const namespace = resolvedType === "income" ? "incomeCategories" : "categories";
  const Icon = categoryIcon(category);

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <Icon data-no-flip className={iconClassName} />
      <span className="truncate capitalize">
        {t(`common.${namespace}.${category}`, category)}
      </span>
    </span>
  );
}
