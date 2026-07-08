import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OnboardingData {
  fullName: string;
  email: string;
  phone: string;
  employmentStatus: string;
  monthlyIncome: string;
  goals: string[];
  riskTolerance: string;
}

const initialData: OnboardingData = {
  fullName: "",
  email: "",
  phone: "",
  employmentStatus: "",
  monthlyIncome: "",
  goals: [],
  riskTolerance: "",
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
  toggleGoal: (goal: string) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      totalSteps: 4,
      started: false,
      data: initialData,
      begin: () => set({ started: true, step: 0, data: initialData }),
      next: () => set((s) => ({ step: Math.min(s.step + 1, s.totalSteps - 1) })),
      back: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
      reset: () => set({ step: 0, started: false, data: initialData }),
      setField: (field, value) => set((s) => ({ data: { ...s.data, [field]: value } })),
      toggleGoal: (goal) =>
        set((s) => ({
          data: {
            ...s.data,
            goals: s.data.goals.includes(goal)
              ? s.data.goals.filter((g) => g !== goal)
              : [...s.data.goals, goal],
          },
        })),
    }),
    { name: "nbe_onboarding" },
  ),
);
