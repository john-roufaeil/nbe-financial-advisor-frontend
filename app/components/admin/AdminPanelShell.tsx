import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";

export const ADMIN_PAGE_SIZE = 20;

/**
 * Shared chrome for every admin tab: loading/error/empty handling around a
 * table, plus a minimal offset pager (the admin lists are all LimitOffset-
 * paginated). Kept deliberately simpler than the end-user Pagination bar —
 * no page-size preference, just prev/next and a running count.
 */
export function AdminPanelShell({
  isLoading,
  isError,
  refetch,
  count,
  offset,
  onOffsetChange,
  emptyLabel,
  filters,
  toolbar,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  count: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
  emptyLabel: string;
  /** Left-aligned header content, e.g. status/type filter selects. */
  filters?: ReactNode;
  /** Right-aligned header content, e.g. an "Add" button. */
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  const from = count === 0 ? 0 : offset + 1;
  const to = Math.min(offset + ADMIN_PAGE_SIZE, count);

  return (
    <div className="flex flex-col gap-3">
      {(filters || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">{filters}</div>
          <div>{toolbar}</div>
        </div>
      )}
      {isLoading ? (
        <div className="grid place-items-center py-14">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : count === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <>
          <div className="border-base-300 bg-base-100 overflow-x-auto rounded-xl border shadow-sm">
            {children}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-base-content/60 text-sm">
              {t("admin.pager.range", { from, to, count })}
            </span>
            <div className="join">
              <button
                type="button"
                className="btn btn-sm join-item"
                disabled={offset === 0}
                onClick={() => onOffsetChange(Math.max(0, offset - ADMIN_PAGE_SIZE))}
                aria-label={t("admin.pager.previous")}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="btn btn-sm join-item"
                disabled={offset + ADMIN_PAGE_SIZE >= count}
                onClick={() => onOffsetChange(offset + ADMIN_PAGE_SIZE)}
                aria-label={t("admin.pager.next")}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
