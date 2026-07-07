import { useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useAuthStore } from "@/store/use-auth-store";
import { PersonalInfoStep } from "@/components/onboarding/PersonalInfoStep";
import { EmploymentStep } from "@/components/onboarding/EmploymentStep";
import { FinancialGoalsStep } from "@/components/onboarding/FinancialGoalsStep";
import { RiskToleranceStep } from "@/components/onboarding/RiskToleranceStep";
import { usePageTitle } from "@/lib/use-page-title";

const STEP_KEYS = [
  "personalInfo",
  "employment",
  "financialGoals",
  "riskTolerance",
] as const;

const STEP_COMPONENTS = {
  personalInfo: PersonalInfoStep,
  employment: EmploymentStep,
  financialGoals: FinancialGoalsStep,
  riskTolerance: RiskToleranceStep,
};

export default function Onboarding() {
  const { step, totalSteps, next, back, reset, data } = useOnboardingStore();
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const isLast = step === totalSteps - 1;
  const stepKey = STEP_KEYS[step];
  const StepComponent = STEP_COMPONENTS[stepKey];
  usePageTitle(t(`onboarding.${stepKey}.title`));

  const prevStepRef = useRef(step);
  const direction = step >= prevStepRef.current ? 1 : -1;
  prevStepRef.current = step;
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const enterX = 16 * direction * (isRtl ? -1 : 1);

  const canContinue =
    stepKey === "personalInfo"
      ? data.fullName.trim().length > 0
      : stepKey === "financialGoals"
        ? data.goals.length > 0
        : stepKey === "riskTolerance"
          ? data.riskTolerance.length > 0
          : true;

  function handlePrimary() {
    if (isLast) {
      reset();
      login();
      navigate(`/${lang}/dashboard`);
    } else {
      next();
    }
  }

  return (
    <div className="bg-base-200 flex min-h-screen items-center justify-center p-6">
      <div className="card bg-base-100 w-full max-w-md shadow-sm">
        <div className="card-body gap-4">
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemax={totalSteps}
          >
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className="bg-base-300 h-1.5 flex-1 overflow-hidden rounded-full"
              >
                <div
                  className="bg-primary h-full rounded-full transition-transform duration-500 ease-out"
                  style={{
                    transform: i <= step ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: isRtl ? "right" : "left",
                  }}
                />
              </div>
            ))}
          </div>

          <div
            key={step}
            style={{ "--step-enter-x": `${enterX}px` } as React.CSSProperties}
            className="flex animate-[step-enter_300ms_ease-out] flex-col gap-4"
          >
            <div>
              <h1 className="card-title">{t(`onboarding.${stepKey}.title`)}</h1>
              <p className="text-base-content/60 mt-1 text-sm">
                {t(`onboarding.${stepKey}.subtitle`)}
              </p>
            </div>
            <StepComponent />
          </div>

          <div className="mt-2 flex justify-between">
            <button className="btn btn-ghost" disabled={step === 0} onClick={back}>
              {t("actions.back")}
            </button>
            <button
              className="btn btn-primary"
              disabled={!canContinue}
              onClick={handlePrimary}
            >
              {isLast ? t("onboarding.finish") : t("actions.continue")}
            </button>
          </div>

          <Link
            to={`/${lang}/sign-in`}
            className="link text-base-content/60 text-center text-sm"
          >
            {t("onboarding.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
