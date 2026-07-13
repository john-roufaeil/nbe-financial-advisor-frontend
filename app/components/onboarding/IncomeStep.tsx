import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { ChipPicker } from "@/components/onboarding/ChipPicker";
import { SliderField } from "@/components/onboarding/SliderField";
import type { STEP_FIELDS, OnboardingStepProps } from "@/lib/onboarding-fields";
import { isFieldUnset, isStepDirty } from "@/lib/onboarding-fields";
import { EMPLOYMENT_OPTIONS, STEADINESS_OPTIONS } from "@/lib/constants/options";
import {
  MONTHLY_INCOME_MIN,
  MONTHLY_INCOME_MAX,
  MONTHLY_INCOME_STEP,
  DEPENDENTS_MIN,
  DEPENDENTS_MAX,
} from "@/lib/constants/limits";

export function IncomeStep({ attempted }: OnboardingStepProps) {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  // Once the user has started this step (or tried to leave it incomplete),
  // every remaining unfilled field is flagged — the step is "all or nothing"
  // (see onboarding.tsx's Continue gating), so a partial fill needs to show
  // exactly what's still missing.
  const dirty = isStepDirty("income", data) || attempted;
  const missing = (field: (typeof STEP_FIELDS)["income"][number]) =>
    dirty && isFieldUnset(field, data[field])
      ? t("onboarding.errors.missing")
      : undefined;
  const statusMissing = missing("employment_status");

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

      <SliderField
        label={t("onboarding.income.monthlyIncome")}
        value={Number(data.monthly_income) || 0}
        onChange={(v) => setField("monthly_income", String(v))}
        min={MONTHLY_INCOME_MIN}
        max={MONTHLY_INCOME_MAX}
        step={MONTHLY_INCOME_STEP}
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
    </div>
  );
}
