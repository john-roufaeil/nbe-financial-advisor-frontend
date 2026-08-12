import { forwardRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DateField } from "@/components/shared/forms/DateField";
import { SimpleSelect } from "@/components/shared/forms/SimpleSelect";
import { AmountRangeFilter } from "@/components/shared/forms/AmountRangeFilter";
import { categoryIcon } from "@/lib/constants/category-icons";
import { Z_POPOVER } from "@/lib/z-index";

/** The filter controls shared by DataToolbar (which collects them) and this
 * popover panel (which renders them). */
export interface ToolbarFiltersProps<F extends string> {
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  filters: readonly F[];
  filter: F;
  onFilterChange: (value: F) => void;
  filterLabel: (filter: F) => string;
  /** Optional category filter (transactions only). */
  categories?: readonly string[];
  category?: string;
  onCategoryChange?: (value: string) => void;
  categoryLabel?: (category: string) => string;
  /** Optional account filter (transactions and bank statements). */
  accounts?: readonly { key: string; label: string }[];
  account?: string;
  onAccountChange?: (value: string) => void;
  /** Optional source filter (transactions only). */
  sources?: readonly { key: string; label: string }[];
  source?: string;
  onSourceChange?: (value: string) => void;
  /** Optional recurring-only toggle (transactions only). */
  recurringOnly?: boolean;
  onRecurringOnlyChange?: (value: boolean) => void;
  /** Optional min/max amount filter (transactions only). */
  amountMin?: number | "";
  onAmountMinChange?: (value: number | "") => void;
  amountMax?: number | "";
  onAmountMaxChange?: (value: number | "") => void;
  /** Whether any filter is currently active — gates showing the clear-all button. */
  hasActiveFilters: boolean;
  onClearAll: () => void;
  /** Draws thin dividers between control groups — worth it once a panel has
   * enough controls to need visual grouping (transactions); pure noise on a
   * short panel with only a couple of controls (bank statements). Defaults
   * to true. */
  showDividers?: boolean;
}

interface DataToolbarFiltersPanelProps<F extends string> extends ToolbarFiltersProps<F> {
  coords: { top: number; left: number };
}

function DataToolbarFiltersPanelInner<F extends string>(
  {
    coords,
    fromDate,
    onFromDateChange,
    toDate,
    onToDateChange,
    filters,
    filter,
    onFilterChange,
    filterLabel,
    categories,
    category,
    onCategoryChange,
    categoryLabel,
    accounts,
    account,
    onAccountChange,
    sources,
    source,
    onSourceChange,
    recurringOnly,
    onRecurringOnlyChange,
    amountMin,
    onAmountMinChange,
    amountMax,
    onAmountMaxChange,
    hasActiveFilters,
    onClearAll,
    showDividers = true,
  }: DataToolbarFiltersPanelProps<F>,
  ref: React.Ref<HTMLDivElement>,
) {
  const { t } = useTranslation();
  const dividerClass = showDividers ? "border-base-200 border-t pt-3" : "";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={t("common.filtersLabel")}
      style={{ top: coords.top, left: coords.left }}
      className={`border-base-300 bg-base-100 animate-a11y-panel-in fixed ${Z_POPOVER} max-h-[80vh] w-72 max-w-[90vw] overflow-y-auto rounded-xl border p-4 shadow-2xl`}
    >
      <div className="flex flex-col gap-3">
        {/* A handful of short options (e.g. All/Income/Expense) reads well as
            tabs; a longer set (e.g. bank-statement pipeline stages) gets
            cramped and wraps awkwardly as tabs, so it becomes a select instead. */}
        {filters.length > 3 ? (
          <SimpleSelect
            value={filter}
            onChange={(v) => onFilterChange(v as F)}
            ariaLabel={t("common.filtersLabel")}
            options={filters.map((f) => ({ value: f, label: filterLabel(f) }))}
          />
        ) : (
          <div className="join border-base-300 w-full rounded-lg border">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFilterChange(f)}
                className={`btn btn-sm join-item flex-1 cursor-pointer ${filter === f ? "btn-accent" : "btn-ghost"}`}
              >
                {filterLabel(f)}
              </button>
            ))}
          </div>
        )}

        {categories && onCategoryChange && (
          <SimpleSelect
            value={category ?? ""}
            onChange={onCategoryChange}
            ariaLabel={t("common.category")}
            className={dividerClass}
            options={[
              { value: "", label: t("common.allCategories") },
              ...categories.map((c) => ({
                value: c,
                label: categoryLabel ? categoryLabel(c) : c,
                icon: categoryIcon(c),
              })),
            ]}
          />
        )}

        {accounts && onAccountChange && (
          <SimpleSelect
            value={account ?? ""}
            onChange={onAccountChange}
            ariaLabel={t("common.account")}
            placeholder={t("common.allAccounts")}
            className={!categories ? dividerClass : ""}
            options={[
              { value: "", label: t("common.allAccounts") },
              ...accounts.map((a) => ({ value: a.key, label: a.label })),
            ]}
          />
        )}

        {sources && onSourceChange && (
          <SimpleSelect
            value={source ?? ""}
            onChange={onSourceChange}
            ariaLabel={t("common.source")}
            placeholder={t("common.allSources")}
            options={[
              { value: "", label: t("common.allSources") },
              ...sources.map((s) => ({ value: s.key, label: s.label })),
            ]}
          />
        )}

        {onRecurringOnlyChange && (
          <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
            <span>{t("common.recurringOnly")}</span>
            <input
              type="checkbox"
              checked={recurringOnly ?? false}
              onChange={(e) => onRecurringOnlyChange(e.target.checked)}
              className="toggle toggle-primary toggle-sm"
            />
          </label>
        )}

        {onAmountMinChange && onAmountMaxChange && (
          <div className={dividerClass}>
            <AmountRangeFilter
              min={amountMin ?? ""}
              max={amountMax ?? ""}
              onMinChange={onAmountMinChange}
              onMaxChange={onAmountMaxChange}
            />
          </div>
        )}

        <div className={`flex flex-col gap-2 ${dividerClass}`}>
          <DateField
            label={t("common.dateFrom")}
            value={fromDate}
            onChange={onFromDateChange}
            max={toDate || undefined}
          />
          <DateField
            label={t("common.dateTo")}
            value={toDate}
            onChange={onToDateChange}
            min={fromDate || undefined}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="btn btn-ghost btn-sm gap-1.5 self-start"
          >
            <X className="size-3.5" />
            {t("common.clearFilters")}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

export const DataToolbarFiltersPanel = forwardRef(DataToolbarFiltersPanelInner) as <
  F extends string,
>(
  props: DataToolbarFiltersPanelProps<F> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof DataToolbarFiltersPanelInner>;
