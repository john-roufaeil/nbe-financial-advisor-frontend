import type { OnboardingData } from "@/store/use-onboarding-store";
import { INITIAL_ONBOARDING_DATA } from "@/store/use-onboarding-store";

// Which onboarding-store fields belong to each (optional) step — used to
// detect whether the user has changed anything on that step, so its "all
// filled or none" gating and per-field "missing" markers can be computed both
// by the route (for the Continue/Skip buttons) and by each step's own
// component (for the individual field borders/messages).
export const STEP_FIELDS = {
  income: [
    "employment_status",
    "monthly_income",
    "income_steadiness",
    "dependents_count",
  ],
  goal: ["goal_name", "goal_target_amount", "goal_target_months"],
  template: ["selected_template_key"],
} as const satisfies Record<string, readonly (keyof OnboardingData)[]>;

export type OptionalStepKey = keyof typeof STEP_FIELDS;

// goal_target_amount's minimum (0) is the one slider value that still reads as
// "didn't answer" rather than a legitimate goal — a zero-amount goal isn't
// meaningful, unlike zero income/dependents or a 1-month goal (all legitimate
// answers, and all already detected as filled the moment the slider is
// touched, since their stored value moves away from the initial "" string).
export const SLIDER_MIN_VALUES: Partial<Record<keyof OnboardingData, number>> = {
  goal_target_amount: 0,
};

export function isFieldUnset(field: keyof OnboardingData, value: string): boolean {
  if (value === INITIAL_ONBOARDING_DATA[field]) return true;
  const min = SLIDER_MIN_VALUES[field];
  return min !== undefined && Number(value) === min;
}

export function isStepDirty(step: OptionalStepKey, data: OnboardingData): boolean {
  return STEP_FIELDS[step].some((field) => !isFieldUnset(field, data[field]));
}

export function isStepComplete(step: OptionalStepKey, data: OnboardingData): boolean {
  return STEP_FIELDS[step].every((field) => !isFieldUnset(field, data[field]));
}
