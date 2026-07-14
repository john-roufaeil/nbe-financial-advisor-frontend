import { QueryClient } from "@tanstack/react-query";
import { QUERY_STALE_TIME_MS } from "@/lib/constants/time";
import { QUERY_RETRY_COUNT, MUTATION_RETRY_COUNT } from "@/lib/constants/limits";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: MUTATION_RETRY_COUNT,
    },
  },
});
