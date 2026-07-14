import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useNumberDisplay } from "@/lib/use-number-display";

/**
 * Read-only summary of everything collected. Password is intentionally absent —
 * it never enters the store and isn't surfaced here.
 */
export function ReviewStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const formatN = useNumberDisplay();

  const raw = (value: string) => ({ provided: value.trim().length > 0, value });
  const opt = (prefix: string, value: string) => ({
    provided: value.length > 0,
    value: value ? t(`${prefix}.${value}`) : "",
  });
  const money = (value: string) => {
    const provided = value.trim().length > 0;
    return {
      provided,
      value: provided ? `${formatN(Number(value))} ${t("currency.EGP")}` : "",
    };
  };

  const rows: { label: string; provided: boolean; value: string }[] = [
    { label: t("onboarding.account.name"), ...raw(data.name) },
    { label: t("onboarding.account.email"), ...raw(data.email) },
    { label: t("onboarding.account.phone"), ...raw(data.phone) },
    {
      label: t("onboarding.income.status"),
      ...opt("onboarding.income.options", data.employment_status),
    },
    { label: t("onboarding.income.monthlyIncome"), ...money(data.monthly_income) },
    {
      label: t("onboarding.income.steadiness"),
      ...opt("onboarding.income.steadinessOptions", data.income_steadiness),
    },
    { label: t("onboarding.income.dependents"), ...raw(data.dependents_count) },
    { label: t("onboarding.goal.name"), ...raw(data.goal_name) },
    { label: t("onboarding.goal.targetAmount"), ...money(data.goal_target_amount) },
    { label: t("onboarding.goal.targetMonths"), ...raw(data.goal_target_months) },
    {
      label: t("onboarding.template.title"),
      provided: data.selected_template_key.length > 0,
      value: data.selected_template_key
        ? t(`onboarding.template.options.${data.selected_template_key}.title`)
        : "",
    },
  ];

  return (
    <dl className="divide-base-200 flex flex-col divide-y text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 py-1.5">
          <dt className="text-base-content/60">{row.label}</dt>
          {row.provided ? (
            <dd className="text-end font-medium">{row.value}</dd>
          ) : (
            <dd
              className="text-base-content/30 text-end"
              aria-label={t("onboarding.review.empty")}
            >
              —
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
