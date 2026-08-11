import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Search } from "lucide-react";
import { useRecommendations } from "@/queries/recommendations";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { PageBanner } from "@/components/shared/layout/PageBanner";
import { CardGridSkeleton } from "@/components/shared/skeletons/CardGridSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import { usePageTitle } from "@/lib/use-page-title";

export default function Recommendations() {
  const { t } = useTranslation();
  usePageTitle(t("recommendations.title"));

  const [input, setInput] = useState("");
  // Only changes on submit, not on every keystroke — GET /recommendations
  // logs a fresh row per result and calls the AI service on every call, so
  // this must not run live-as-you-type (see useRecommendations' docstring).
  const [query, setQuery] = useState("");

  const {
    data: recommendations,
    isPending,
    isError,
    refetch,
  } = useRecommendations(query);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuery(input.trim());
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("recommendations.title")}
        subtitle={t("recommendations.subtitle")}
        icon={Sparkles}
      />

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <Search data-no-flip className="text-base-content/40 size-4 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("recommendations.searchPlaceholder")}
            className="grow"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          {t("recommendations.search")}
        </button>
      </form>

      {isPending ? (
        <CardGridSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : recommendations.length === 0 ? (
        <EmptyState icon={Sparkles} label={t("recommendations.empty")} />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((recommendation) => (
            <li key={recommendation.id}>
              <RecommendationCard recommendation={recommendation} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
