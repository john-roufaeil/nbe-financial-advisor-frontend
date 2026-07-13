import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Pagination } from "@/components/shared/layout/Pagination";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { CardGridSkeleton } from "@/components/shared/skeletons/CardGridSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { useLoadAnimation } from "@/lib/use-load-animation";

/** List = single column of rows; grid = responsive cards. */
const VIEW_CONTAINER = {
  list: "flex flex-col gap-2",
  grid: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
} as const;

/**
 * Shared frame of the transactions and bank-statements tabs: a toolbar card
 * with an attached pagination row, then the query-state block (view-aware
 * skeleton / error / item list / empty state), a standalone bottom
 * pagination, and finally any modals passed as children.
 */
export function PagedListSection<T>({
  toolbar,
  isPending,
  isError,
  onRetry,
  items,
  total,
  renderItem,
  emptyIcon,
  emptyLabel,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalLabelKey,
  children,
}: {
  /** DataToolbar (or equivalent), already wired to this list's filters. */
  toolbar: ReactNode;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  items: readonly T[] | undefined;
  total: number | undefined;
  /** Must set a `key` on the returned element. */
  renderItem: (item: T, viewMode: "list" | "grid") => ReactNode;
  emptyIcon: LucideIcon;
  emptyLabel: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalLabelKey: string;
  /** Detail/edit modals rendered inside the section, after the list. */
  children?: ReactNode;
}) {
  const viewMode = useDisplayPreferencesStore((s) => s.viewMode);
  const loadAnimation = useLoadAnimation(isPending);

  const paginationProps = {
    page,
    totalPages: Math.max(1, Math.ceil((total ?? 0) / pageSize)),
    total: total ?? 0,
    pageSize,
    onPageChange,
    onPageSizeChange,
    totalLabelKey,
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="border-base-300 bg-base-100 animate-entry rounded-xl border shadow-sm">
        {toolbar}
        <Pagination attached {...paginationProps} />
      </div>

      {isPending ? (
        viewMode === "grid" ? (
          <CardGridSkeleton />
        ) : (
          <ListSkeleton />
        )
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : items && items.length > 0 ? (
        <ul className={`${loadAnimation} ${VIEW_CONTAINER[viewMode]}`}>
          {items.map((item) => renderItem(item, viewMode))}
        </ul>
      ) : (
        <EmptyState icon={emptyIcon} label={emptyLabel} className={loadAnimation} />
      )}

      <Pagination {...paginationProps} />

      {children}
    </div>
  );
}
