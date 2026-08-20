import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import type { OnboardingData } from "@/store/use-onboarding-store";
import { useNumberDisplay } from "@/lib/use-number-display";
import { Tooltip } from "@/components/shared/Tooltip";
import type { OptionalStepKey } from "@/lib/onboarding-fields";

/**
 * Read-only recap of income/goal/template, shown on the account step (the
 * last one) since that's now the only place all three have already been
 * collected. Account fields aren't repeated here — they're the form right
 * below this. Every row doubles as an edit shortcut: hovering shows an
 * "Edit" tooltip, clicking jumps to that field's step and highlights it
 * (see onboarding.tsx's handleEditField).
 */
export function PlanSummary({
  onEdit,
}: {
  onEdit: (step: OptionalStepKey, field: keyof OnboardingData) => void;
}) {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const formatN = useNumberDisplay();

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

  // Just the name — like every other row here, this is a one-fact recap, not
  // the full breakdown (amount/duration are already behind on this same
  // screen if the user scrolls back up).
  const goalProvided = !!data.goal_name.trim();
  const goalValue = data.goal_name;

  const rows: {
    label: string;
    provided: boolean;
    value: string;
    step: OptionalStepKey;
    field: keyof OnboardingData;
  }[] = [
    {
      label: t("onboarding.income.status"),
      step: "income",
      field: "employment_status",
      ...opt("onboarding.income.options", data.employment_status),
    },
    {
      label: t("onboarding.income.monthlyIncome"),
      step: "income",
      field: "monthly_income",
      ...money(data.monthly_income),
    },
    {
      label: t("onboarding.goal.title"),
      step: "goal",
      field: "goal_name",
      provided: goalProvided,
      value: goalValue,
    },
    {
      label: t("onboarding.template.summaryLabel"),
      step: "template",
      field: "selected_template_key",
      provided: data.selected_template_key.length > 0,
      value: data.selected_template_key
        ? t(`onboarding.template.options.${data.selected_template_key}.title`)
        : "",
    },
  ];

  return (
    <div className="bg-base-200/50 rounded-box flex flex-col gap-2 p-3.5">
      <p className="text-base-content/60 text-xs font-medium">
        {t("onboarding.account.summaryTitle")}
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt className="py-0.5 whitespace-nowrap">
              <Tooltip content={t("onboarding.review.edit")}>
                <button
                  type="button"
                  onClick={() => onEdit(row.step, row.field)}
                  className="text-base-content/60 hover:text-primary cursor-pointer text-start"
                >
                  {row.label}
                </button>
              </Tooltip>
            </dt>
            <dd className="py-0.5 text-end">
              <Tooltip content={t("onboarding.review.edit")}>
                <button
                  type="button"
                  onClick={() => onEdit(row.step, row.field)}
                  aria-label={row.provided ? undefined : t("onboarding.review.empty")}
                  className={`hover:text-primary cursor-pointer ${
                    row.provided ? "font-medium" : "text-base-content/30"
                  }`}
                >
                  {row.provided ? row.value : "—"}
                </button>
              </Tooltip>
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
