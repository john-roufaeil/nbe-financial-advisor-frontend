import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { Feedback, FeedbackTargetType, SubmitFeedbackBody } from "@/types/feedback";

interface RawFeedback {
  id: string;
  target_type: string;
  target_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

function toFeedback(raw: RawFeedback): Feedback {
  return {
    id: raw.id,
    targetType: raw.target_type as FeedbackTargetType,
    targetId: raw.target_id,
    rating: raw.rating,
    comment: raw.comment,
    createdAt: raw.created_at,
  };
}

/**
 * A target_id that exists but belongs to another user 404s — identical to a
 * target_id that doesn't exist at all, so the caller can't distinguish the
 * two (the endpoint never leaks whether an id belongs to someone else).
 */
export async function submitFeedback(body: SubmitFeedbackBody): Promise<Feedback> {
  const res = await apiClient.post<RawFeedback>(API_ENDPOINTS.feedback, {
    target_type: body.targetType,
    target_id: body.targetId,
    ...(body.rating !== undefined ? { rating: body.rating } : {}),
    ...(body.comment !== undefined ? { comment: body.comment } : {}),
  });
  return toFeedback(res.data);
}
