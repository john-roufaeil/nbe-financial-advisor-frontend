import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { OptionCard } from "@/components/onboarding/OptionCard";

const GOAL_OPTIONS = [
  "emergencyFund",
  "buyHome",
  "retireEarly",
  "payDebt",
  "growInvestments",
] as const;

export function FinancialGoalsStep() {
  const { t } = useTranslation();
  const goals = useOnboardingStore((s) => s.data.goals);
  const toggleGoal = useOnboardingStore((s) => s.toggleGoal);

  return (
    <div className="grid grid-cols-2 gap-2">
      {GOAL_OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          selected={goals.includes(opt)}
          onClick={() => toggleGoal(opt)}
          title={t(`onboarding.financialGoals.options.${opt}`)}
        />
      ))}
    </div>
  );
}
