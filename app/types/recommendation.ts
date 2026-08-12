/**
 * One matched product recommendation (GET /recommendations,
 * RecommendationItemSerializer). `id` is a RecommendationLog id, not a
 * Product id — it identifies THIS shown instance, which is what
 * POST /recommendations/{id}/feedback reacts to (a product shown twice
 * gets two different ids, each independently reactable).
 */
export interface RecommendationItem {
  id: string;
  title: string;
  description: string | null;
  categories: string[];
  tags: string[];
  features: Record<string, unknown> | null;
  externalLink: string | null;
  similarityScore: number;
}

/** At least one of rating/comment is required — enforced server-side too. */
export interface RecommendationFeedbackBody {
  rating?: number;
  comment?: string;
}
