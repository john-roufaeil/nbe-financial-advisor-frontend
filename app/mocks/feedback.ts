import { delay } from "@/mocks/shared";
import type { Feedback, SubmitFeedbackBody } from "@/types/feedback";

export function submitFeedback(body: SubmitFeedbackBody): Promise<Feedback> {
  const feedback: Feedback = {
    id: crypto.randomUUID(),
    targetType: body.targetType,
    targetId: body.targetId,
    rating: body.rating ?? null,
    comment: body.comment ?? null,
    createdAt: new Date().toISOString(),
  };
  return delay(feedback);
}
