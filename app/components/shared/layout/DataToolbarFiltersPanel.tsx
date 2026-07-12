import { forwardRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DateField } from "@/components/shared/forms/DateField";
import { Z_POPOVER } from "@/lib/z-index";

interface DataToolbarFiltersPanelProps<F extends string> {
  coords: { top: number; left: number };
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  filters: readonly F[];
  filter: F;
  onFilterChange: (value: F) => void;
  filterLabel: (filter: F) => string;
  categories?: readonly string[];
  category?: string;
  onCategoryChange?: (value: string) => void;
  categoryLabel?: (category: string) => string;
  amountRanges?: readonly { key: string; label: string }[];
  amountRange?: string;
  onAmountRangeChange?: (key: string) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
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
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="select select-bordered select-sm w-full"
            aria-label={t("common.category")}
          >
            <option value="">{t("common.allCategories")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel ? categoryLabel(c) : c}
              </option>
            ))}
          </select>
        )}

        {amountRanges && onAmountRangeChange && (
          <select
            value={amountRange}
            onChange={(e) => onAmountRangeChange(e.target.value)}
            className="select select-bordered select-sm w-full"
            aria-label={t("common.amountRange")}
          >
            {amountRanges.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
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
