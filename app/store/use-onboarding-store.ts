import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Field names mirror the backend request bodies (snake_case) so wiring is a
 * swap, not a rewrite:
 *   name / email / phone                       -> POST /auth/signup
 *   employment_status ... dependents_count      -> PATCH /users/me
 *   goal_* / selected_template_key              -> POST /budget
 *
 * NOTE: `password` is deliberately NOT part of this shape. This store is
 * persisted to localStorage, and the password must never be written to any
 * client store (bank-adjacent app). It lives only in local component state in
 * the Account step and is used solely for the one-off signup call.
 */
export interface OnboardingData {
  name: string;
  email: string;
  phone: string;
  employment_status: string;
  monthly_income: string;
  income_bracket: string;
  income_steadiness: string;
  dependents_count: string;
  goal_name: string;
  goal_target_amount: string;
  goal_target_months: string;
  selected_template_key: string;
}

const initialData: OnboardingData = {
  name: "",
  email: "",
  phone: "",
  employment_status: "",
  monthly_income: "",
  income_bracket: "",
  income_steadiness: "",
  dependents_count: "",
  goal_name: "",
  goal_target_amount: "",
  goal_target_months: "",
  selected_template_key: "",
};

interface OnboardingState {
  step: number;
  totalSteps: number;
  /** True once the user has accepted consent and entered the onboarding flow. */
  started: boolean;
  data: OnboardingData;
  begin: () => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  setField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      totalSteps: 5,
      started: false,
      data: initialData,
      begin: () => set({ started: true, step: 0, data: initialData }),
      next: () => set((s) => ({ step: Math.min(s.step + 1, s.totalSteps - 1) })),
      back: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
      reset: () => set({ step: 0, started: false, data: initialData }),
      setField: (field, value) => set((s) => ({ data: { ...s.data, [field]: value } })),
    }),
    // version bumped: the field set changed (4-step -> 5-step), so any stale
    // persisted `data` is discarded instead of hydrating a mismatched shape.
    { name: "nbe_onboarding", version: 1 },
  ),
);
