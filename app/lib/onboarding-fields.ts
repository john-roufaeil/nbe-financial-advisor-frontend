import type { OnboardingData } from "@/store/use-onboarding-store";
import { INITIAL_ONBOARDING_DATA } from "@/store/use-onboarding-store";

// Which onboarding-store fields belong to each (optional) step — used to
// detect whether the user has changed anything on that step, so its "all
// filled or none" gating and per-field "missing" markers can be computed both
// by the route (for the Continue/Skip buttons) and by each step's own
// component (for the individual field borders/messages).
export const STEP_FIELDS = {
  income: ["employment_status"],
  goal: ["goal_name", "goal_target_amount", "goal_target_months"],
  template: ["selected_template_key"],
} as const satisfies Record<string, readonly (keyof OnboardingData)[]>;

export type OptionalStepKey = keyof typeof STEP_FIELDS;

/** Props every optional onboarding step receives from onboarding.tsx. */
export interface OnboardingStepProps {
  /** True once the user has tried to move on while this step is incomplete —
   * shows "missing" state immediately rather than waiting for the step to
   * become dirty on its own. */
  attempted: boolean;
}

/**
 * Whether a step's "Skip" button is offered.
 *
 * The income step is NOT skippable: the plan's per-category budget is derived
 * from monthly income (allocated_amount = monthly_income x percentage), so a
 * plan built without it stores zero against every category and then reads back
 * as "you don't have a plan yet". The template step has never been skippable —
 * a plan needs allocations to be a plan at all. That leaves the goal step, which
 * is genuinely optional: a budget stands on its own without one.
 */
export function isStepSkippable(step: OptionalStepKey): boolean {
  return step === "goal";
}

// Slider values that still read as "didn't answer" rather than a legitimate
// answer. A zero-amount goal isn't a goal, and zero income can't fund a plan —
// both leave the thing they configure meaningless. Zero dependents and a
// 1-month goal, by contrast, are real answers, and every field is otherwise
// detected as filled the moment the slider is touched (its stored value moves
// away from the initial "" string).
export const SLIDER_MIN_VALUES: Partial<Record<keyof OnboardingData, number>> = {
  goal_target_amount: 0,
  monthly_income: 0,
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
