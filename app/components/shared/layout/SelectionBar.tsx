import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Bulk-selection bar shown above a paged list once at least one row is
 * checked — select-all-on-this-page, a count, and a bulk-delete action. */
export function SelectionBar({
  selectedCount,
  totalOnPage,
  allOnPageSelected,
  onSelectAll,
  onClear,
  onDeleteSelected,
  deletePending,
}: {
  selectedCount: number;
  totalOnPage: number;
  allOnPageSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  deletePending: boolean;
}) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="border-base-300 bg-base-200/50 flex flex-wrap items-center gap-3 border-t px-3 py-2 sm:px-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={allOnPageSelected}
          onChange={onSelectAll}
          aria-label={t("actions.selectAll", { count: totalOnPage })}
        />
        {t("common.selection.count", { count: selectedCount })}
      </label>

      <div className="ms-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={deletePending}
          className="btn btn-error btn-outline btn-sm gap-1.5"
        >
          <Trash2 className="size-4" />
          {t("actions.deleteSelected")}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="btn btn-ghost btn-sm btn-square"
          aria-label={t("actions.deselectAll")}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
