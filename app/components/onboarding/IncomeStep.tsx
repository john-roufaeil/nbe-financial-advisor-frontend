import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";

const EMPLOYMENT_OPTIONS = [
  "employed",
  "selfEmployed",
  "student",
  "unemployed",
  "retired",
] as const;

const BRACKET_OPTIONS = ["lt_10k", "10k_25k", "25k_50k", "gt_50k"] as const;

// Values match the backend's expected income_steadiness strings.
const STEADINESS_OPTIONS = ["steady", "variable", "seasonal"] as const;

export function IncomeStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.income.status")}</span>
        <select
          value={data.employment_status}
          onChange={(e) => setField("employment_status", e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          <option value="" disabled>
            {t("onboarding.income.statusPlaceholder")}
          </option>
          {EMPLOYMENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`onboarding.income.options.${opt}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.income.monthlyIncome")}</span>
        <input
          type="number"
          min={0}
          value={data.monthly_income}
          onChange={(e) => setField("monthly_income", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.income.bracket")}</span>
        <select
          value={data.income_bracket}
          onChange={(e) => setField("income_bracket", e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          <option value="" disabled>
            {t("onboarding.income.bracketPlaceholder")}
          </option>
          {BRACKET_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`onboarding.income.bracketOptions.${opt}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.income.steadiness")}</span>
        <select
          value={data.income_steadiness}
          onChange={(e) => setField("income_steadiness", e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          <option value="" disabled>
            {t("onboarding.income.steadinessPlaceholder")}
          </option>
          {STEADINESS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`onboarding.income.steadinessOptions.${opt}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.income.dependents")}</span>
        <input
          type="number"
          min={0}
          value={data.dependents_count}
          onChange={(e) => setField("dependents_count", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
    </div>
  );
}
