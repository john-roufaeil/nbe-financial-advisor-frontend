import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastSuccess, toastApiError } from "@/lib/toast";

/** Picks the mock or real implementation module for the active data source. */
export function pickImpl<T>(source: DataSource, api: T, mock: T): T {
  return source === "mock" ? mock : api;
}

/**
 * The mutation shape every write in the app shares: run the active data
 * source's implementation, invalidate each query root the write restates,
 * toast a success key, and toast API errors. Per-call `mutate(vars, options)`
 * callbacks still fire in addition to these, as with any useMutation.
 *
 * Writes with different success handling (e.g. profile's cache write-through)
 * use useMutation directly.
 */
export function useInvalidatingMutation<TVars, TData>({
  mutationFn,
  invalidates,
  successToastKey,
}: {
  mutationFn: (source: DataSource, vars: TVars) => Promise<TData>;
  /** Query keys to invalidate on success — root-level keys hit every source. */
  invalidates: readonly QueryKey[];
  successToastKey: string;
}) {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (vars: TVars) => mutationFn(source, vars),
    onSuccess: () => {
      for (const queryKey of invalidates) {
        queryClient.invalidateQueries({ queryKey });
      }
      toastSuccess(successToastKey);
    },
    onError: (error) => toastApiError(error),
  });
}
