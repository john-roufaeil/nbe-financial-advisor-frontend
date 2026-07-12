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
  /** i18n key (e.g. "transactions.pagination.total") pluralized via {{count}}. */
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
          ? "border-base-300 bg-base-100 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t px-3 py-2 sm:px-4"
          : "border-base-300 bg-base-100 animate-entry mt-auto flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 shadow-sm sm:px-4"
      }
    >
      <div className="flex items-center gap-2">
        <span className="text-base-content/60 text-xs font-medium tabular-nums">
          {t(totalLabelKey, { count: total })}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label={t("common.pagination.perPage", { count: pageSize })}
          className="select select-bordered select-xs w-fit tabular-nums"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {t("common.pagination.perPage", { count: size })}
            </option>
          ))}
        </select>
      </div>

      <nav
        aria-label={t("common.pagination.page", { page, totalPages })}
        className="flex items-center gap-1"
      >
        <Tooltip content={t("common.pagination.prev")}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t("common.pagination.prev")}
            className="btn btn-ghost btn-sm btn-square relative before:absolute before:-inset-1.5 before:content-[''] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ChevronLeft className="size-4" />
          </button>
        </Tooltip>

        {/* Numbered pages need real 40px+ tap targets and can run to ~9 buttons wide
            (first, ellipsis, 3 neighbours, ellipsis, last, plus the arrows), which
            doesn't fit a 320px viewport — collapse to a plain "page X of Y" readout
            below `sm` instead of shrinking targets or letting the row overflow. */}
        <span className="text-base-content/60 px-2 text-xs font-medium tabular-nums sm:hidden">
          {t("common.pagination.page", { page, totalPages })}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {pageItems(page, totalPages).map((item, i) =>
            item === "…" ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="text-base-content/40 grid size-8 place-items-center text-xs"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={t("common.pagination.goToPage", { page: item })}
                aria-current={item === page ? "page" : undefined}
                className={`btn btn-sm btn-square relative tabular-nums before:absolute before:-inset-1 before:content-[''] ${
                  item === page ? "btn-accent" : "btn-ghost"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <Tooltip content={t("common.pagination.next")}>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t("common.pagination.next")}
            className="btn btn-ghost btn-sm btn-square relative before:absolute before:-inset-1.5 before:content-[''] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ChevronRight className="size-4" />
          </button>
        </Tooltip>
      </nav>
    </div>
  );
}
