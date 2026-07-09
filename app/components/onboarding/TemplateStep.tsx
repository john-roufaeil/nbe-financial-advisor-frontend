import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useStarterTemplates } from "@/queries/budget";
import { CardSkeleton, ErrorState } from "@/components/shared/QueryState";

export function TemplateStep() {
  const { t } = useTranslation();
  const selected = useOnboardingStore((s) => s.data.selected_template_key);
  const setField = useOnboardingStore((s) => s.setField);
  // GET /budget/starter-templates via the data-source-aware query hook.
  const { data: templates, isPending, isError, refetch } = useStarterTemplates();

  if (isPending) {
    return <CardSkeleton cards={3} />;
  }
  if (isError || !templates) {
    return (
      <ErrorState message={t("onboarding.template.error")} onRetry={() => refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
