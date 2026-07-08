import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { OptionCard } from "@/components/onboarding/OptionCard";

const RISK_OPTIONS = ["conservative", "moderate", "aggressive"] as const;

export function RiskToleranceStep() {
  const { t } = useTranslation();
  const riskTolerance = useOnboardingStore((s) => s.data.riskTolerance);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <div className="flex flex-col gap-2">
      {RISK_OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          selected={riskTolerance === opt}
          onClick={() => setField("riskTolerance", opt)}
          title={t(`onboarding.riskTolerance.options.${opt}.title`)}
          description={t(`onboarding.riskTolerance.options.${opt}.description`)}
        />
      ))}
    </div>
  );
}
