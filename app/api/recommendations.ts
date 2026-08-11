import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  RecommendationFeedbackBody,
  RecommendationItem,
} from "@/types/recommendation";

interface RawRecommendationItem {
  id: string;
  title: string;
  description: string | null;
  categories: string[];
  tags: string[];
  features: Record<string, unknown> | null;
  external_link: string | null;
  similarity_score: number;
}

function toRecommendationItem(raw: RawRecommendationItem): RecommendationItem {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    categories: raw.categories,
    tags: raw.tags,
    features: raw.features,
    externalLink: raw.external_link,
    similarityScore: raw.similarity_score,
  };
}

/**
 * `q` is free-text, matched AI-side (not a queryset filter) — every call
 * (even with the same `q`) logs a fresh RecommendationLog row per result,
 * so this is deliberately not cached/deduped beyond normal query-key
 * behavior (see useRecommendations).
 */
export async function getRecommendations(q?: string): Promise<RecommendationItem[]> {
  const res = await apiClient.get<RawRecommendationItem[]>(
    API_ENDPOINTS.recommendations,
    {
      params: q ? { q } : undefined,
    },
  );
  return res.data.map(toRecommendationItem);
}

export async function submitRecommendationFeedback(
  id: string,
  body: RecommendationFeedbackBody,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.recommendationFeedback(id), body);
}
