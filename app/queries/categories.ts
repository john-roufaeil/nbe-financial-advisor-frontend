import { useQuery } from "@tanstack/react-query";
import * as categoriesApi from "@/api/categories";
import * as categoriesMock from "@/mocks/categories";
import type { Category } from "@/types/category";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl } from "@/queries/shared";

export const categoryKeys = {
  all: [QUERY_ROOTS.categories] as const,
  list: (source: DataSource) => [...categoryKeys.all, "list", source] as const,
};

/**
 * The category taxonomy, cached for the whole session: it only changes via
 * admin writes (a different app), so staleTime/gcTime are Infinity — every
 * screen shares the one fetch instead of refetching on mount/focus.
 */
export function useCategories() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: categoryKeys.list(source),
    queryFn: () => pickImpl(source, categoriesApi, categoriesMock).getCategories(),
    staleTime: Infinity,
    gcTime: Infinity,
    select: sortFallbackLast,
  });
}

/** The catch-all bucket ("other" / "other_income") reads best as the last
 * resort it is, not interspersed alphabetically among real categories — every
 * category list in the app (dropdowns, filters, legends) should end with it. */
function sortFallbackLast(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => Number(a.isFallback) - Number(b.isFallback));
}

/** Same fallback-last rule for callers that only have a category name and a
 * ranking value (e.g. allocated percentage) — sorts by `value` descending,
 * except any name in `fallbackNames` is always pushed to the end. */
export function sortByValueFallbackLast<T>(
  items: T[],
  value: (item: T) => number,
  isFallback: (item: T) => boolean,
): T[] {
  return [...items].sort((a, b) => {
    const af = Number(isFallback(a));
    const bf = Number(isFallback(b));
    if (af !== bf) return af - bf;
    return value(b) - value(a);
  });
}

/** One side of the taxonomy — expense categories are the budget buckets,
 * income categories are informational only. Empty while loading. */
export function useCategoriesForType(type: Category["type"]): Category[] {
  const { data } = useCategories();
  return data?.filter((c) => c.type === type) ?? [];
}
