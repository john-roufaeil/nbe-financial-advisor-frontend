import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { SliderField } from "@/components/onboarding/SliderField";
import { RequiredMark } from "@/components/onboarding/RequiredMark";
import type { STEP_FIELDS, OnboardingStepProps } from "@/lib/onboarding-fields";
import { isFieldUnset, isStepDirty } from "@/lib/onboarding-fields";
import {
  GOAL_TARGET_MAX,
  GOAL_MONTHS_MAX,
  GOAL_TARGET_STEP,
} from "@/lib/constants/limits";
import { NAME_SUGGESTIONS } from "@/lib/constants/options";
/**
 * Maps to the `goal` object of POST /budget:
 *   goal_name          -> goal.name
 *   goal_target_amount -> goal.target_amount
 *   goal_target_months -> goal.target_months
 * No API call on this step — the goal is held in form state until step 5.
 */
export function GoalStep({ attempted }: OnboardingStepProps) {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  // Once the user has started this step (or tried to leave it incomplete),
  // every remaining unfilled field is flagged — the step is "all or nothing"
  // (see onboarding.tsx's Continue gating), so a partial fill needs to show
  // exactly what's still missing.
  const dirty = isStepDirty("goal", data) || attempted;
  const missing = (field: (typeof STEP_FIELDS)["goal"][number]) =>
    dirty && isFieldUnset(field, data[field]);

  // Both sliders default to 0 rather than requiring an explicit first pick,
  // so 0 alone doesn't mean "invalid" — only once the user has actually
  // moved the slider (or typed into its number box) and landed on 0 is that
  // a real answer worth flagging, since 0 isn't a usable target/duration.
  const [amountTouched, setAmountTouched] = useState(false);
  const [monthsTouched, setMonthsTouched] = useState(false);
  const amountValue = Number(data.goal_target_amount) || 0;
  const monthsValue = Number(data.goal_target_months) || 0;
  // SliderField now renders its own `error` (the generic "Missing." message,
  // passed below) when the step is dirty and the field's still unset — these
  // more specific range messages would otherwise double up with it once
  // `attempted` (or the other field) makes the step dirty while this one's
  // still sitting at 0.
  const amountRangeError =
    amountTouched && amountValue === 0 && !missing("goal_target_amount")
      ? t("onboarding.goal.errors.amountRange", {
          max: GOAL_TARGET_MAX.toLocaleString(),
        })
      : undefined;
  const monthsRangeError =
    monthsTouched && monthsValue === 0 && !missing("goal_target_months")
      ? t("onboarding.goal.errors.monthsRange", {
          max: GOAL_MONTHS_MAX.toLocaleString(),
        })
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label-text inline-flex items-center gap-1.5 text-xs">
          {t("onboarding.goal.name")}
          <RequiredMark />
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
      <div className="flex flex-col gap-1">
        <SliderField
          label={t("onboarding.goal.targetAmount")}
          value={amountValue}
          onChange={(v) => {
            setAmountTouched(true);
            setField("goal_target_amount", String(v));
          }}
          min={0}
          max={GOAL_TARGET_MAX}
          step={GOAL_TARGET_STEP}
          unit={t("currency.EGP")}
          presets={[
            GOAL_TARGET_MAX / 100,
            GOAL_TARGET_MAX / 20,
            GOAL_TARGET_MAX / 10,
            GOAL_TARGET_MAX / 4,
            GOAL_TARGET_MAX / 2,
          ].map((amount) => ({
            value: amount,
            label: amount.toLocaleString(),
          }))}
          error={
            missing("goal_target_amount") ? t("onboarding.errors.missing") : undefined
          }
          required
        />
        {amountRangeError && (
          <span role="alert" className="text-error text-xs">
            {amountRangeError}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <SliderField
          label={t("onboarding.goal.targetMonths")}
          value={monthsValue}
          onChange={(v) => {
            setMonthsTouched(true);
            setField("goal_target_months", String(v));
          }}
          min={0}
          max={GOAL_MONTHS_MAX}
          step={1}
          unit={t("onboarding.goal.monthsUnit", { count: monthsValue || 1 })}
          presets={[
            GOAL_MONTHS_MAX / 10,
            GOAL_MONTHS_MAX / 5,
            GOAL_MONTHS_MAX / 2.5,
            GOAL_MONTHS_MAX / 1.25,
          ].map((amount) => ({
            value: amount,
            label: amount.toLocaleString(),
          }))}
          error={
            missing("goal_target_months") ? t("onboarding.errors.missing") : undefined
          }
          required
        />
        {monthsRangeError && (
          <span role="alert" className="text-error text-xs">
            {monthsRangeError}
          </span>
        )}
      </div>
    </div>
  );
}
