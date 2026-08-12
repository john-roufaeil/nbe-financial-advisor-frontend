import { useMutation, useQuery } from "@tanstack/react-query";
import * as recommendationsApi from "@/api/recommendations";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastApiError } from "@/lib/toast";
import type { RecommendationFeedbackBody } from "@/types/recommendation";

export const recommendationKeys = {
  list: (q: string) => [QUERY_ROOTS.recommendations, q] as const,
};

/**
 * `q` here should only ever change on an explicit search submit, not on
 * every keystroke — GET /recommendations is NOT a pure read: every call
 * logs a fresh RecommendationLog row per result and (now that
 * USE_MOCK_AI_SERVICE is off) makes a real AI-service/LLM match call.
 * Debounce-as-you-type would spam both. Callers should keep the raw input
 * value in local state and only feed a submitted value in here.
 */
export function useRecommendations(q: string) {
  return useQuery({
    queryKey: recommendationKeys.list(q),
    queryFn: () => recommendationsApi.getRecommendations(q || undefined),
  });
}

/**
 * Not an useInvalidatingMutation: there's no recommendations query this
 * should invalidate (resubmitting the list would just log more shown-again
 * rows, not reflect "this one was rated") — callers track submitted state
 * locally instead (see RecommendationCard).
 */
export function useSubmitRecommendationFeedback() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RecommendationFeedbackBody }) =>
      recommendationsApi.submitRecommendationFeedback(id, body),
    // No success toast — RecommendationCard already shows its own inline
    // "thanks" confirmation in place of the rating form once isSuccess
    // flips; a toast on top would just be noise.
    onError: (error) => toastApiError(error),
  });
}
