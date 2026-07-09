import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { ChipPicker } from "@/components/onboarding/ChipPicker";
import { SliderField } from "@/components/onboarding/SliderField";

const EMPLOYMENT_OPTIONS = [
  "employed",
  "selfEmployed",
  "student",
  "unemployed",
  "retired",
] as const;

// Values match the backend's expected income_steadiness strings.
const STEADINESS_OPTIONS = ["steady", "variable", "seasonal"] as const;

export function IncomeStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <div className="flex flex-col gap-4">
      <ChipPicker
        label={t("onboarding.income.status")}
        options={EMPLOYMENT_OPTIONS.map((opt) => ({
          value: opt,
          label: t(`onboarding.income.options.${opt}`),
        }))}
        value={data.employment_status}
        onChange={(v) => setField("employment_status", v)}
      />

      <SliderField
        label={t("onboarding.income.monthlyIncome")}
        value={Number(data.monthly_income) || 0}
        onChange={(v) => setField("monthly_income", String(v))}
        min={0}
        max={100_000}
        step={500}
        unit={t("currency.EGP")}
      />

      <ChipPicker
        label={t("onboarding.income.steadiness")}
        options={STEADINESS_OPTIONS.map((opt) => ({
          value: opt,
          label: t(`onboarding.income.steadinessOptions.${opt}`),
        }))}
        value={data.income_steadiness}
        onChange={(v) => setField("income_steadiness", v)}
      />

      <SliderField
        label={t("onboarding.income.dependents")}
        value={Number(data.dependents_count) || 0}
        onChange={(v) => setField("dependents_count", String(v))}
        min={0}
        max={10}
        step={1}
      />
    </div>
  );
}
