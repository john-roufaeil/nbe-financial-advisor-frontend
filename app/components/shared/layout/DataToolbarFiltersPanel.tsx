import { forwardRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DateField } from "@/components/shared/forms/DateField";
import { SimpleSelect } from "@/components/shared/forms/SimpleSelect";
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
  /** Optional preset amount-range filter (transactions only). */
  amountRanges?: readonly { key: string; label: string }[];
  amountRange?: string;
  onAmountRangeChange?: (key: string) => void;
  /** Whether any filter is currently active — gates showing the clear-all button. */
  hasActiveFilters: boolean;
  onClearAll: () => void;
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
    amountRanges,
    amountRange,
    onAmountRangeChange,
    hasActiveFilters,
    onClearAll,
  }: DataToolbarFiltersPanelProps<F>,
  ref: React.Ref<HTMLDivElement>,
) {
  const { t } = useTranslation();

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

        {categories && onCategoryChange && (
          <SimpleSelect
            value={category ?? ""}
            onChange={onCategoryChange}
            ariaLabel={t("common.category")}
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

        {amountRanges && onAmountRangeChange && (
          <SimpleSelect
            value={amountRange ?? ""}
            onChange={onAmountRangeChange}
            ariaLabel={t("common.amountRange")}
            options={amountRanges.map((r) => ({ value: r.key, label: r.label }))}
          />
        )}

        <div className="flex flex-col gap-2">
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
