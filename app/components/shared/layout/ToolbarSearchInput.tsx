import { Search, X, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";

export function ToolbarSearchInput({
  value,
  onChange,
  searching = false,
}: {
  value: string;
  onChange: (value: string) => void;
  /** True while the typed query hasn't produced settled results yet (debounce
   * still pending or the request in flight) — shows a spinner in the field. */
  searching?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
      <label className="input input-bordered flex w-full min-w-0 flex-1 items-center gap-2 px-3 py-2">
        <Search data-no-flip className="text-base-content/40 size-4 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("common.search")}
          className="min-w-0 grow"
        />
        {searching && (
          <LoaderCircle
            aria-label={t("common.loading")}
            className="text-base-content/40 size-4 shrink-0 animate-spin"
          />
        )}
        {value && (
          <Tooltip content={t("actions.clear")} className="shrink-0">
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={t("actions.clear")}
              className="btn btn-ghost btn-sm btn-square relative before:absolute before:-inset-2 before:content-['']"
            >
              <X className="size-3.5" />
            </button>
          </Tooltip>
        )}
      </label>
    </div>
  );
}
