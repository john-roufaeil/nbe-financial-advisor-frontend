import { Search, X, List, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DateField } from "@/components/shared/DateField";
import { useViewModeStore, type ViewMode } from "@/store/use-view-mode-store";

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
}: DataToolbarProps<F>) {
  const { t } = useTranslation();
  const viewMode = useViewModeStore((s) => s.mode);
  const setViewMode = useViewModeStore((s) => s.setMode);

  const viewOptions: { mode: ViewMode; icon: typeof List; label: string }[] = [
    { mode: "list", icon: List, label: t("data.view.list") },
    { mode: "grid", icon: LayoutGrid, label: t("data.view.grid") },
  ];

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="input input-bordered flex w-full min-w-0 flex-1 items-center gap-2 px-3 py-2">
          <Search className="text-base-content/40 size-4 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("data.search")}
            className="min-w-0 grow"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label={t("actions.clear")}
              className="btn btn-ghost btn-xs btn-square shrink-0"
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <DateField
          label={t("data.dateFrom")}
          value={fromDate}
          onChange={onFromDateChange}
        />
        <DateField label={t("data.dateTo")} value={toDate} onChange={onToDateChange} />
        <div className="join border-base-300 w-fit shrink-0 rounded-lg border">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={`btn btn-sm join-item cursor-pointer ${filter === f ? "btn-accent" : "btn-ghost"}`}
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-2">
          <div className="join border-base-300 w-fit shrink-0 rounded-lg border">
            {viewOptions.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                aria-pressed={viewMode === mode}
                title={label}
                className={`btn btn-sm join-item btn-square cursor-pointer ${
                  viewMode === mode ? "btn-accent" : "btn-ghost"
                }`}
              >
                <Icon data-no-flip className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
