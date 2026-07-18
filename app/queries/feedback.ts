import { useMutation } from "@tanstack/react-query";
import * as feedbackApi from "@/api/feedback";
import * as feedbackMock from "@/mocks/feedback";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { pickImpl } from "@/queries/shared";
import { toastApiError } from "@/lib/toast";
import type { SubmitFeedbackBody } from "@/types/feedback";

function impl(source: DataSource) {
  return pickImpl(source, feedbackApi, feedbackMock);
}

/**
 * Generic: works for any target (transaction, chat message, budget) — the
 * caller picks targetType/targetId. No success toast; a toast on every
 * thumbs-up click or star rating would be noise for an action this casual
 * and frequent (same reasoning as chat's useSendMessage).
 */
export function useSubmitFeedback() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: SubmitFeedbackBody) => impl(source).submitFeedback(body),
    onError: (error) => toastApiError(error),
  });
}
