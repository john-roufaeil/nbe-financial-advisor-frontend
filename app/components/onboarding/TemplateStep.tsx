import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import type { OnboardingData } from "@/store/use-onboarding-store";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useStarterTemplates } from "@/queries/budget";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import { useHighlightRef } from "@/lib/use-highlight-ref";

export function TemplateStep({
  highlightField,
}: {
  highlightField?: keyof OnboardingData | null;
}) {
  const { t } = useTranslation();
  const selected = useOnboardingStore((s) => s.data.selected_template_key);
  const setField = useOnboardingStore((s) => s.setField);
  const highlighted = highlightField === "selected_template_key";
  const highlightRef = useHighlightRef<HTMLDivElement>(highlighted);
  // GET /budget/starter-templates via the data-source-aware query hook.
  const { data: templates, isPending, isError, refetch } = useStarterTemplates();

  // Default to the first template once they load and nothing is selected yet.
  useEffect(() => {
    if (!selected && templates?.length) {
      setField("selected_template_key", templates[0].template_key);
    }
  }, [selected, templates, setField]);

  if (isPending) {
    return <ListSkeleton rows={3} />;
  }
  if (isError || !templates) {
    return (
      <ErrorState message={t("onboarding.template.error")} onRetry={() => refetch()} />
    );
  }

  return (
    <div
      ref={highlightRef}
      className={`flex flex-col gap-2 rounded-lg transition-shadow ${
        highlighted ? "ring-primary ring-offset-base-100 ring-2 ring-offset-2" : ""
      }`}
    >
      {templates.map((tpl) => (
        <OptionCard
          key={tpl.template_key}
          selected={selected === tpl.template_key}
          onClick={() => setField("selected_template_key", tpl.template_key)}
          title={t(`onboarding.template.options.${tpl.template_key}.title`)}
          description={t(`onboarding.template.options.${tpl.template_key}.description`)}
        />
      ))}
    </div>
  );
}
