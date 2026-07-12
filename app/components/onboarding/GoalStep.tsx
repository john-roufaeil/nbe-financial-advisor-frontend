import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { SliderField } from "@/components/onboarding/SliderField";
import type { STEP_FIELDS } from "@/lib/onboarding-fields";
import { isFieldUnset, isStepDirty } from "@/lib/onboarding-fields";

// Quick-fill suggestions for the free-text goal name — clicking one just
// fills the input; the user can still type their own name.
const NAME_SUGGESTIONS = [
  "emergencyFund",
  "travel",
  "newCar",
  "homeDownpayment",
  "homeRenovation",
] as const;

/**
 * Maps to the `goal` object of POST /budget:
 *   goal_name          -> goal.name
 *   goal_target_amount -> goal.target_amount
 *   goal_target_months -> goal.target_months
 * No API call on this step — the goal is held in form state until step 5.
 */
export function GoalStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  // Once the user has started this step, every remaining unfilled field is
  // flagged — the step is "all or nothing" (see onboarding.tsx's Continue
  // gating), so a partial fill needs to show exactly what's still missing.
  const dirty = isStepDirty("goal", data);
  const missing = (field: (typeof STEP_FIELDS)["goal"][number]) =>
    dirty && isFieldUnset(field, data[field]);
  const nameMissing = missing("goal_name");

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label-text inline-flex items-center gap-1.5 text-xs">
          {t("onboarding.goal.name")}
          {nameMissing && (
            <span
              className="bg-error inline-block size-1.5 shrink-0 rounded-full"
              role="img"
              aria-label={t("onboarding.errors.missing")}
            />
          )}
        </span>
        <label className="input input-bordered flex w-full items-center gap-2">
          <input
            type="text"
            value={data.goal_name}
            onChange={(e) => setField("goal_name", e.target.value)}
            placeholder={t("onboarding.goal.namePlaceholder")}
            maxLength={20}
            className="min-w-0 grow"
          />
          {data.goal_name && (
            <button
              type="button"
              onClick={() => setField("goal_name", "")}
              aria-label={t("actions.clear")}
              className="btn btn-ghost btn-xs btn-square shrink-0"
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {NAME_SUGGESTIONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setField("goal_name", t(`onboarding.goal.suggestions.${key}`))
              }
              className="btn btn-outline btn-sm cursor-pointer select-none"
            >
              {t(`onboarding.goal.suggestions.${key}`)}
            </button>
          ))}
        </div>
      </label>
      <SliderField
        label={t("onboarding.goal.targetAmount")}
        value={Number(data.goal_target_amount) || 0}
        onChange={(v) => setField("goal_target_amount", String(v))}
        min={0}
        max={1_000_000}
        step={1_000}
        unit={t("currency.EGP")}
        presets={[10_000, 50_000, 100_000, 250_000, 500_000].map((amount) => ({
          value: amount,
          label: amount.toLocaleString(),
        }))}
        error={missing("goal_target_amount") ? t("onboarding.errors.missing") : undefined}
      />
      <SliderField
        label={t("onboarding.goal.targetMonths")}
        value={Number(data.goal_target_months) || 1}
        onChange={(v) => setField("goal_target_months", String(v))}
        min={1}
        max={60}
        step={1}
        unit={t("onboarding.goal.monthsUnit", {
          count: Number(data.goal_target_months) || 1,
        })}
        error={missing("goal_target_months") ? t("onboarding.errors.missing") : undefined}
      />
    </div>
  );
}
