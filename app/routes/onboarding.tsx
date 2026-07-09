import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useAuthStore } from "@/store/use-auth-store";
import { AccountStep } from "@/components/onboarding/AccountStep";
import { IncomeStep } from "@/components/onboarding/IncomeStep";
import { GoalStep } from "@/components/onboarding/GoalStep";
import { TemplateStep } from "@/components/onboarding/TemplateStep";
import { ReviewStep } from "@/components/onboarding/ReviewStep";
import { useSignup } from "@/queries/auth";
import { useUpdateProfile } from "@/queries/profile";
import { useStarterTemplates, useCreateBudget } from "@/queries/budget";
import { usePageTitle } from "@/lib/use-page-title";

const STEP_KEYS = ["account", "income", "goal", "template", "review"] as const;

export default function Onboarding() {
  const { step, totalSteps, next, back, reset, data } = useOnboardingStore();
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const isLast = step === totalSteps - 1;
  const stepKey = STEP_KEYS[step];
  usePageTitle(t(`onboarding.${stepKey}.title`));

  // Password lives only in local component state — never in the persisted
  // onboarding store (bank-adjacent app). Used solely for POST /auth/signup.
  const [password, setPassword] = useState("");

  // Guards against double-submit while a step's async call is in flight. A ref
  // (not state) so it doesn't change how anything renders.
  const submittingRef = useRef(false);

  const signup = useSignup();
  const updateProfile = useUpdateProfile();
  const createBudget = useCreateBudget();
  // Same query (cached) TemplateStep uses — lets the review step read the
  // selected template's allocations for the create-budget call.
  const { data: templates } = useStarterTemplates();

  const prevStepRef = useRef(step);
  const direction = step >= prevStepRef.current ? 1 : -1;
  prevStepRef.current = step;
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const enterX = 16 * direction * (isRtl ? -1 : 1);

  const canContinue =
    stepKey === "account"
      ? data.name.trim().length > 0 &&
        data.email.trim().length > 0 &&
        password.length >= 8
      : stepKey === "goal"
        ? data.goal_name.trim().length > 0 &&
          data.goal_target_amount.trim().length > 0 &&
          data.goal_target_months.trim().length > 0
        : stepKey === "template"
          ? data.selected_template_key.length > 0
          : true;

  async function handlePrimary() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      if (stepKey === "account") {
        // Step 1 → POST /auth/signup. Password from LOCAL state only. Tokens are
        // stored (useSignup.onSuccess) but isAuthenticated is NOT flipped here.
        await signup.mutateAsync({
          name: data.name,
          email: data.email,
          password,
          phone: data.phone.trim() ? data.phone : undefined,
        });
        next();
      } else if (stepKey === "income") {
        // Step 2 → PATCH /users/me with ONLY the step-2 fields.
        await updateProfile.mutateAsync({
          employment_status: data.employment_status,
          monthly_income: data.monthly_income,
          income_bracket: data.income_bracket,
          income_steadiness: data.income_steadiness,
          dependents_count: data.dependents_count,
        });
        next();
      } else if (stepKey === "goal") {
        // Step 3 → no API call; goal held in form state.
        next();
      } else if (stepKey === "template") {
        // Step 4 → options loaded by TemplateStep; selection already in state.
        next();
      } else {
        // Step 5 → POST /budget (allocations from the chosen template, sum 100),
        // then flip isAuthenticated and go to the dashboard.
        const template = templates?.find(
          (tpl) => tpl.template_key === data.selected_template_key,
        );
        await createBudget.mutateAsync({
          selected_template_key: data.selected_template_key,
          goal: {
            name: data.goal_name,
            target_amount: Number(data.goal_target_amount),
            target_months: Number(data.goal_target_months),
          },
          allocations: template?.allocations ?? [],
        });
        reset();
        setPassword("");
        login();
        navigate(`/${lang}/dashboard`);
      }
    } catch {
      // Writes (signup, profile, budget) must NOT fake success. The mutation's
      // onError already surfaced a toast; stay on the current step, don't advance.
    } finally {
      submittingRef.current = false;
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
            {stepKey === "account" ? (
              <AccountStep password={password} onPasswordChange={setPassword} />
            ) : stepKey === "income" ? (
              <IncomeStep />
            ) : stepKey === "goal" ? (
              <GoalStep />
            ) : stepKey === "template" ? (
              <TemplateStep />
            ) : (
              <ReviewStep />
            )}
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
