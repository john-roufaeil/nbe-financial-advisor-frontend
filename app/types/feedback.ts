export type FeedbackTargetType = "transaction" | "message" | "budget";

export interface SubmitFeedbackBody {
  targetType: FeedbackTargetType;
  targetId: string;
  /** At least one of rating/comment is required (backend 422s otherwise). */
  rating?: number;
  comment?: string;
}

export interface Feedback {
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  rating: number | null;
  comment: string | null;
  createdAt: string;
}
