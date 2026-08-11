import { useMutation } from "@tanstack/react-query";
import * as feedbackApi from "@/api/feedback";
import { toastApiError } from "@/lib/toast";
import type { SubmitFeedbackBody } from "@/types/feedback";

/**
 * Generic: works for any target (transaction, chat message, budget) — the
 * caller picks targetType/targetId. No success toast; a toast on every
 * thumbs-up click or star rating would be noise for an action this casual
 * and frequent (same reasoning as chat's useSendMessage).
 */
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (body: SubmitFeedbackBody) => feedbackApi.submitFeedback(body),
    onError: (error) => toastApiError(error),
  });
}
