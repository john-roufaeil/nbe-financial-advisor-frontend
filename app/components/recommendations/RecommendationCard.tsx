import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Star, Check } from "lucide-react";
import { useSubmitRecommendationFeedback } from "@/queries/recommendations";
import type { RecommendationItem } from "@/types/recommendation";

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label={t("recommendations.rate")}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={t("recommendations.stars", { count: star })}
          onClick={() => onChange(star)}
          className="btn btn-ghost btn-xs btn-square"
        >
          <Star
            data-no-flip
            className={`size-4 ${
              value !== null && star <= value
                ? "fill-warning text-warning"
                : "text-base-content/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function RecommendationCard({
  recommendation,
}: {
  recommendation: RecommendationItem;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const submitFeedback = useSubmitRecommendationFeedback();

  const canSubmit = rating !== null || comment.trim().length > 0;
  const submitted = submitFeedback.isSuccess;

  function handleSubmit() {
    submitFeedback.mutate({
      id: recommendation.id,
      body: {
        ...(rating !== null ? { rating } : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      },
    });
  }

  return (
    <div className="border-base-300 bg-base-100 animate-entry flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{recommendation.title}</p>
          {recommendation.description && (
            <p className="text-base-content/60 mt-0.5 text-xs">
              {recommendation.description}
            </p>
          )}
        </div>
        <span className="badge badge-primary badge-outline shrink-0 text-xs">
          {t("recommendations.match", {
            percent: Math.round(recommendation.similarityScore * 100),
          })}
        </span>
      </div>

      {recommendation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recommendation.tags.map((tag) => (
            <span key={tag} className="badge badge-ghost text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {recommendation.externalLink && (
        <a
          href={recommendation.externalLink}
          target="_blank"
          rel="noreferrer"
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          {t("recommendations.learnMore")}
          <ExternalLink data-no-flip className="size-3" />
        </a>
      )}

      <div className="border-base-200 flex flex-col gap-2 border-t pt-3">
        {submitted ? (
          <p className="text-success flex items-center gap-1.5 text-xs font-medium">
            <Check data-no-flip className="size-4" />
            {t("recommendations.feedbackSent")}
          </p>
        ) : (
          <>
            <StarRating value={rating} onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("recommendations.commentPlaceholder")}
              rows={2}
              className="textarea textarea-bordered textarea-sm w-full"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitFeedback.isPending}
              className="btn btn-primary btn-sm self-end"
            >
              {t("recommendations.sendFeedback")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
