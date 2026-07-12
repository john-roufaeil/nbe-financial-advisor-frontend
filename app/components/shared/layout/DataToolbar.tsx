import { useCallback, useRef, useState } from "react";
import {
  List,
  LayoutGrid,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  SlidersHorizontal,
  Rows3,
  Rows2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { ToggleSwitch } from "@/components/shared/forms/ToggleSwitch";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { useDismissablePanel } from "@/lib/use-dismissable-panel";
import { ToolbarSearchInput } from "@/components/shared/layout/ToolbarSearchInput";
import { DataToolbarFiltersPanel } from "@/components/shared/layout/DataToolbarFiltersPanel";

/** Matches the filters panel's `w-72` class. */
const PANEL_WIDTH = 288;

interface DataToolbarProps<F extends string> {
  search: string;
  onSearchChange: (value: string) => void;
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
  /** Optional date sort toggle (transactions only). */
  sort?: "asc" | "desc";
  onSortChange?: (value: "asc" | "desc") => void;
  /** Whether any filter is currently active — gates showing the clear-all button. */
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function DataToolbar<F extends string>({
  search,
  onSearchChange,
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
  sort,
  onSortChange,
  hasActiveFilters,
  onClearAll,
}: DataToolbarProps<F>) {
  const { t } = useTranslation();
  const viewMode = useDisplayPreferencesStore((s) => s.viewMode);
  const setViewMode = useDisplayPreferencesStore((s) => s.setViewMode);
  const density = useDisplayPreferencesStore((s) => s.density);
  const setDensity = useDisplayPreferencesStore((s) => s.setDensity);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelCoords, setPanelCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updateCoords = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rtl = document.documentElement.dir === "rtl";
    // Anchor to the trigger's inline-end edge so the panel opens toward the
    // reading-end direction in both LTR and RTL, instead of always growing
    // rightward and running off-screen when the trigger sits near the right
    // edge in RTL layouts.
    let left = rtl ? rect.right - PANEL_WIDTH : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - PANEL_WIDTH - 8));
    setPanelCoords({ top: rect.bottom + 8, left });
  }, []);

  useDismissablePanel({
    open: filtersOpen,
    onClose: () => setFiltersOpen(false),
    panelRef,
    triggerRef,
    reposition: updateCoords,
  });

  return (
    <div className="bg-base-100 flex flex-col gap-3 rounded-t-xl p-3 sm:p-4">
      <ToolbarSearchInput value={search} onChange={onSearchChange} />

      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="relative shrink-0">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            className={`btn btn-sm gap-1.5 ${hasActiveFilters ? "btn-accent" : "btn-outline"}`}
          >
            <SlidersHorizontal className="size-4" />
            {t("common.filtersLabel")}
            {hasActiveFilters && (
              <span className="bg-base-100/70 size-1.5 rounded-full" />
            )}
          </button>

          {filtersOpen && panelCoords && (
            <DataToolbarFiltersPanel
              ref={panelRef}
              coords={panelCoords}
              fromDate={fromDate}
              onFromDateChange={onFromDateChange}
              toDate={toDate}
              onToDateChange={onToDateChange}
              filters={filters}
              filter={filter}
              onFilterChange={onFilterChange}
              filterLabel={filterLabel}
              categories={categories}
              category={category}
              onCategoryChange={onCategoryChange}
              categoryLabel={categoryLabel}
              amountRanges={amountRanges}
              amountRange={amountRange}
              onAmountRangeChange={onAmountRangeChange}
              hasActiveFilters={hasActiveFilters}
              onClearAll={onClearAll}
            />
          )}
        </div>

        {onSortChange && (
          <Tooltip
            content={
              sort === "asc" ? t("common.sort.dateDesc") : t("common.sort.dateAsc")
            }
          >
            <button
              type="button"
              onClick={() => onSortChange(sort === "asc" ? "desc" : "asc")}
              className="btn btn-ghost btn-sm shrink-0 gap-1.5"
              aria-label={
                sort === "asc" ? t("common.sort.dateDesc") : t("common.sort.dateAsc")
              }
            >
              {sort === "asc" ? (
                <ArrowUpNarrowWide className="size-4" />
              ) : (
                <ArrowDownNarrowWide className="size-4" />
              )}
            </button>
          </Tooltip>
        )}

        <div className="w-20 shrink-0">
          <ToggleSwitch
            value={density}
            options={["comfortable", "compact"]}
            labels={{
              comfortable: t("common.density.comfortable"),
              compact: t("common.density.compact"),
            }}
            icons={{ comfortable: Rows2, compact: Rows3 }}
            onChange={setDensity}
            aria-label={t("common.density.toggleLabel")}
            showLabels={false}
          />
        </div>

        <div className="ms-auto w-20 shrink-0">
          <ToggleSwitch
            value={viewMode}
            options={["list", "grid"]}
            labels={{ list: t("common.view.list"), grid: t("common.view.grid") }}
            icons={{ list: List, grid: LayoutGrid }}
            onChange={setViewMode}
            aria-label={t("common.view.toggleLabel")}
            showLabels={false}
          />
        </div>
      </div>
    </div>
  );
}
