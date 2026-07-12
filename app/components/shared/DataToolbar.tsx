import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  X,
  List,
  LayoutGrid,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DateField } from "@/components/shared/DateField";
import { Tooltip } from "@/components/shared/Tooltip";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { useViewModeStore } from "@/store/use-view-mode-store";
import { useDismissablePanel } from "@/lib/use-dismissable-panel";
import { Z_POPOVER } from "@/lib/z-index";

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
  const viewMode = useViewModeStore((s) => s.mode);
  const setViewMode = useViewModeStore((s) => s.setMode);
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
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="input input-bordered flex w-full min-w-0 flex-1 items-center gap-2 px-3 py-2">
          <Search className="text-base-content/40 size-4 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("common.search")}
            className="min-w-0 grow"
          />
          {search && (
            <Tooltip content={t("actions.clear")} className="shrink-0">
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={t("actions.clear")}
                className="btn btn-ghost btn-sm btn-square relative before:absolute before:-inset-2 before:content-['']"
              >
                <X className="size-3.5" />
              </button>
            </Tooltip>
          )}
        </label>
      </div>

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

          {filtersOpen &&
            panelCoords &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={panelRef}
                role="dialog"
                aria-label={t("common.filtersLabel")}
                style={{ top: panelCoords.top, left: panelCoords.left }}
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
