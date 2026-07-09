import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";

/**
 * Read-only summary of everything collected. Password is intentionally absent —
 * it never enters the store and isn't surfaced here.
 */
export function ReviewStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const empty = t("onboarding.review.empty");

  const raw = (value: string) => (value.trim() ? value : empty);
  const opt = (prefix: string, value: string) =>
    value ? t(`${prefix}.${value}`) : empty;

  const rows: { label: string; value: string }[] = [
    { label: t("onboarding.account.name"), value: raw(data.name) },
    { label: t("onboarding.account.email"), value: raw(data.email) },
    { label: t("onboarding.account.phone"), value: raw(data.phone) },
    {
      label: t("onboarding.income.status"),
      value: opt("onboarding.income.options", data.employment_status),
    },
    { label: t("onboarding.income.monthlyIncome"), value: raw(data.monthly_income) },
    {
      label: t("onboarding.income.bracket"),
      value: opt("onboarding.income.bracketOptions", data.income_bracket),
    },
    {
      label: t("onboarding.income.steadiness"),
      value: opt("onboarding.income.steadinessOptions", data.income_steadiness),
    },
    { label: t("onboarding.income.dependents"), value: raw(data.dependents_count) },
    { label: t("onboarding.goal.name"), value: raw(data.goal_name) },
    { label: t("onboarding.goal.targetAmount"), value: raw(data.goal_target_amount) },
    { label: t("onboarding.goal.targetMonths"), value: raw(data.goal_target_months) },
    {
      label: t("onboarding.template.title"),
      value: data.selected_template_key
        ? t(`onboarding.template.options.${data.selected_template_key}.title`)
        : empty,
    },
  ];

  return (
    <dl className="divide-base-200 flex flex-col divide-y text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 py-1.5">
          <dt className="text-base-content/60">{row.label}</dt>
          <dd className="text-end font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
