import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { ChipPicker } from "@/components/onboarding/ChipPicker";
import { SliderField } from "@/components/onboarding/SliderField";
import type { OnboardingStepProps } from "@/lib/onboarding-fields";
import { isFieldUnset } from "@/lib/onboarding-fields";
import { EMPLOYMENT_OPTIONS, STEADINESS_OPTIONS } from "@/lib/constants/options";
import {
  MONTHLY_INCOME_MIN,
  MONTHLY_INCOME_MAX,
  MONTHLY_INCOME_STEP,
  DEPENDENTS_MIN,
  DEPENDENTS_MAX,
} from "@/lib/constants/limits";

export function IncomeStep({ attempted, highlightField }: OnboardingStepProps) {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  // A field's "missing" marker only lights up once that field itself has
  // been touched, or once the user has tried to move on ("attempted") — so
  // filling in monthly income doesn't flash a "missing" error on the
  // still-untouched employment status chip, and vice versa.
  const [incomeTouched, setIncomeTouched] = useState(false);
  const statusMissing =
    attempted && isFieldUnset("employment_status", data.employment_status)
      ? t("onboarding.income.errors.statusRequired")
      : undefined;
  const incomeMissing =
    (attempted || incomeTouched) && isFieldUnset("monthly_income", data.monthly_income)
      ? t("onboarding.income.errors.monthlyIncomeRequired")
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <ChipPicker
        key={"status"}
        label={t("onboarding.income.status")}
        options={EMPLOYMENT_OPTIONS.map((opt) => ({
          value: opt,
          label: t(`onboarding.income.options.${opt}`),
        }))}
        value={data.employment_status}
        onChange={(v) => setField("employment_status", v)}
        error={statusMissing}
        required
        highlighted={highlightField === "employment_status"}
      />

      <SliderField
        label={t("onboarding.income.monthlyIncome")}
        value={Number(data.monthly_income) || 0}
        onChange={(v) => {
          setIncomeTouched(true);
          setField("monthly_income", String(v));
        }}
        min={MONTHLY_INCOME_MIN}
        max={MONTHLY_INCOME_MAX}
        step={MONTHLY_INCOME_STEP}
        unit={t("currency.EGP")}
        error={incomeMissing}
        required
        highlighted={highlightField === "monthly_income"}
      />

      <SliderField
        label={t("onboarding.income.dependents")}
        value={Number(data.dependents_count) || 0}
        onChange={(v) => setField("dependents_count", String(v))}
        min={DEPENDENTS_MIN}
        max={DEPENDENTS_MAX}
        step={1}
        unit={t("onboarding.income.personUnit", {
          count: Number(data.dependents_count) || 0,
        })}
        info={t("onboarding.income.dependentsInfo")}
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
    </div>
  );
}
