import { Plus, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DateField } from "@/components/shared/DateField";

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
  onAdd: () => void;
  addLabel: string;
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
  onAdd,
  addLabel,
}: DataToolbarProps<F>) {
  const { t } = useTranslation();

  return (
    <div className="bg-base-100 border-base-300 animate-entry flex flex-col gap-3 rounded-2xl border p-3 shadow-sm sm:p-4">
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
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel}
          title={addLabel}
          className="btn btn-primary btn-sm shrink-0 gap-2 sm:hidden"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
        </div>

        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel}
          title={addLabel}
          className="btn btn-primary btn-sm hidden shrink-0 sm:inline-flex"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
