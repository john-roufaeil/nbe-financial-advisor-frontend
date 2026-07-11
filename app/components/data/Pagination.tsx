import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** i18n key (e.g. "data.pagination.totalTransactions") pluralized via {{count}}. */
  totalLabelKey: string;
  /** True when rendered directly beneath DataToolbar inside the same card (top); false for the standalone bar at the bottom of the page. */
  attached?: boolean;
}

/**
 * Compact page list that always shows the first and last page, the current page
 * and its immediate neighbours, and collapses the rest into ellipses:
 * 1 … 4 [5] 6 … 20
 */
function pageItems(current: number, total: number): (number | "…")[] {
  const items: (number | "…")[] = [];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  items.push(1);
  if (left > 2) items.push("…");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < total - 1) items.push("…");
  if (total > 1) items.push(total);
  return items;
}

/**
 * Total count + page-size preference (grouped together), and real numbered page
 * navigation. Rendered twice per page with identical content and styling: attached
 * beneath the DataToolbar at the top, and as a standalone card at the bottom.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalLabelKey,
  attached = false,
}: PaginationProps) {
  const { t } = useTranslation();

  return (
    <div
      className={
        attached
          ? "border-base-300 bg-base-100 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t px-3 py-2 sm:px-4"
          : "border-base-300 bg-base-100 animate-entry mt-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-sm sm:px-4"
      }
    >
      <div className="flex items-center gap-2">
        <span className="text-base-content/60 text-xs font-medium tabular-nums">
          {t(totalLabelKey, { count: total })}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label={t("data.pagination.perPage", { count: pageSize })}
          className="select select-bordered select-xs w-fit tabular-nums"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {t("data.pagination.perPage", { count: size })}
            </option>
          ))}
        </select>
      </div>

      <nav
        aria-label={t("data.pagination.page", { page, totalPages })}
        className="flex items-center gap-1"
      >
        <Tooltip content={t("data.pagination.prev")}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t("data.pagination.prev")}
            className="btn btn-ghost btn-xs btn-square disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        </Tooltip>

        {pageItems(page, totalPages).map((item, i) =>
          item === "…" ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="text-base-content/40 grid size-6 place-items-center text-xs"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={t("data.pagination.goToPage", { page: item })}
              aria-current={item === page ? "page" : undefined}
              className={`btn btn-xs btn-square tabular-nums ${
                item === page ? "btn-accent" : "btn-ghost"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <Tooltip content={t("data.pagination.next")}>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t("data.pagination.next")}
            className="btn btn-ghost btn-xs btn-square disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </Tooltip>
      </nav>
    </div>
  );
}
