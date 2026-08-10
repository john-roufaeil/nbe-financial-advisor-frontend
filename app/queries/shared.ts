import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toastSuccess, toastApiError } from "@/lib/toast";

/**
 * The mutation shape every write in the app shares: run the API call,
 * invalidate each query root the write restates, toast a success key, and
 * toast API errors. Per-call `mutate(vars, options)` callbacks still fire in
 * addition to these, as with any useMutation.
 *
 * Writes with different success handling (e.g. profile's cache write-through)
 * use useMutation directly.
 */
export function useInvalidatingMutation<TVars, TData>({
  mutationFn,
  invalidates,
  removes,
  successToastKey,
}: {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Query keys to invalidate on success — root-level keys hit every source. */
  invalidates: readonly QueryKey[];
  /**
   * Query keys to *remove* (evict) from cache on success — use for deletes
   * so the cache entry is gone before invalidated list queries refetch,
   * preventing a 404 refetch on the now-missing resource.
   */
  removes?: (vars: TVars) => QueryKey[];
  successToastKey: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, vars) => {
      if (removes) {
        for (const queryKey of removes(vars)) {
          queryClient.removeQueries({ queryKey });
        }
      }
      for (const queryKey of invalidates) {
        queryClient.invalidateQueries({ queryKey });
      }
      toastSuccess(successToastKey);
    },
    onError: (error) => toastApiError(error),
  });
}
