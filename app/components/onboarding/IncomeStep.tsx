import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { ChipPicker } from "@/components/onboarding/ChipPicker";
import { SliderField } from "@/components/onboarding/SliderField";
import type { STEP_FIELDS } from "@/lib/onboarding-fields";
import { isFieldUnset, isStepDirty } from "@/lib/onboarding-fields";

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

  // Once the user has started this step, every remaining unfilled field is
  // flagged — the step is "all or nothing" (see onboarding.tsx's Continue
  // gating), so a partial fill needs to show exactly what's still missing.
  const dirty = isStepDirty("income", data);
  const missing = (field: (typeof STEP_FIELDS)["income"][number]) =>
    dirty && isFieldUnset(field, data[field])
      ? t("onboarding.errors.missing")
      : undefined;

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
        error={missing("employment_status")}
      />

      <SliderField
        label={t("onboarding.income.monthlyIncome")}
        value={Number(data.monthly_income) || 0}
        onChange={(v) => setField("monthly_income", String(v))}
        min={0}
        max={100_000}
        step={500}
        unit={t("currency.EGP")}
        error={missing("monthly_income")}
      />

      <ChipPicker
        label={t("onboarding.income.steadiness")}
        options={STEADINESS_OPTIONS.map((opt) => ({
          value: opt,
          label: t(`onboarding.income.steadinessOptions.${opt}`),
        }))}
        value={data.income_steadiness}
        onChange={(v) => setField("income_steadiness", v)}
        error={missing("income_steadiness")}
      />

      <SliderField
        label={t("onboarding.income.dependents")}
        value={Number(data.dependents_count) || 0}
        onChange={(v) => setField("dependents_count", String(v))}
        min={0}
        max={10}
        step={1}
        error={missing("dependents_count")}
      />
    </div>
  );
}
