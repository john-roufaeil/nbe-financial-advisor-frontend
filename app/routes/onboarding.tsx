import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, ChevronsRight, Check } from "lucide-react";
import {
  useOnboardingStore,
  INITIAL_ONBOARDING_DATA,
} from "@/store/use-onboarding-store";
import { useAuthStore } from "@/store/use-auth-store";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { Button } from "@/components/shared/Button";
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

// Which onboarding-store fields belong to each step — used to detect whether
// the user has changed anything on an (optional) step, so its button can flip
// from an outlined "Skip" to a primary "Continue".
const STEP_FIELDS = {
  income: [
    "employment_status",
    "monthly_income",
    "income_steadiness",
    "dependents_count",
  ],
  goal: ["goal_name", "goal_target_amount", "goal_target_months"],
  template: ["selected_template_key"],
} as const;

// Slider-backed fields report their minimum as an unset/untouched value —
// sitting at the floor (e.g. dragging monthly income down to 0) reads the
// same as never having touched the field, so the step stays skippable.
const SLIDER_MIN_VALUES: Partial<Record<keyof typeof INITIAL_ONBOARDING_DATA, number>> = {
  monthly_income: 0,
  dependents_count: 0,
  goal_target_amount: 0,
  goal_target_months: 1,
};

function isFieldUnset(field: keyof typeof INITIAL_ONBOARDING_DATA, value: string) {
  if (value === INITIAL_ONBOARDING_DATA[field]) return true;
  const min = SLIDER_MIN_VALUES[field];
  return min !== undefined && Number(value) === min;
}

export default function Onboarding() {
  const { step, totalSteps, next, back, goToStep, reset, data } = useOnboardingStore();
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

  // Consent acknowledgement, merged into the account step. Kept in local state
  // (not persisted) — a per-session acknowledgement gating signup.
  const [agreed, setAgreed] = useState(false);

  // Guards against double-submit while a step's async call is in flight. A ref
  // (not state) so it doesn't change how anything renders.
  const submittingRef = useRef(false);

  // Every step's data is held locally until "Create plan" on the final step —
  // no API calls fire before then. If a later call in that sequence fails
  // after an earlier one already succeeded, retrying "Create plan" must not
  // redo the calls that already went through (e.g. signup can't be repeated
  // — the email is already registered), so completed steps are tracked here.
  const completedRef = useRef({ signup: false, profile: false });

  const signup = useSignup();
  const updateProfile = useUpdateProfile();
  const createBudget = useCreateBudget();
  const isSubmitting =
    signup.isPending || updateProfile.isPending || createBudget.isPending;
  // Same query (cached) TemplateStep uses — lets the review step read the
  // selected template's allocations for the create-budget call.
  const { data: templates } = useStarterTemplates();

  const prevStepRef = useRef(step);
  const prevStep = prevStepRef.current;
  const direction = step >= prevStep ? 1 : -1;
  prevStepRef.current = step;
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const enterX = 16 * direction * (isRtl ? -1 : 1);

  // Only the account step is required (name, email, password, consent).
  // Every later step is optional — its button reads "Skip" until the user
  // touches one of that step's fields, at which point it becomes "Continue".
  const isAccountValid =
    data.name.trim().length > 0 &&
    data.email.trim().length > 0 &&
    password.length >= 8 &&
    agreed;

  const stepIsDirty =
    stepKey === "account" || stepKey === "review"
      ? false
      : STEP_FIELDS[stepKey].some((field) => !isFieldUnset(field, data[field]));

  // Step 0 always gates on validity. Later (optional) steps are always
  // continuable — dirty ones submit as "Continue", clean ones as "Skip".
  const canContinue = stepKey === "account" ? isAccountValid : true;
  const isSkip = stepKey !== "account" && stepKey !== "review" && !stepIsDirty;

  // Can only jump to a step ahead of the current one if the account step
  // (the one hard gate) has already been satisfied.
  function isStepLocked(target: number) {
    return target > 0 && !isAccountValid && step === 0;
  }

  function handleStepClick(target: number) {
    if (isSubmitting || target === step || isStepLocked(target)) return;
    goToStep(target);
  }

  async function handlePrimary() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      if (!isLast) {
        // Steps 1-4 → no API calls. Everything is held in local/store state
        // until "Create plan" on the final step.
        next();
        return;
      }

      // Final step → run signup, profile update, and budget creation in
      // sequence, all triggered only by this click. If a call already
      // succeeded on a prior attempt (partial failure + retry), it's not
      // repeated — signup in particular can't run twice for the same email.
      if (!completedRef.current.signup) {
        await signup.mutateAsync({
          name: data.name,
          email: data.email,
          password,
          phone: data.phone.trim() ? data.phone : undefined,
        });
        completedRef.current.signup = true;
      }

      const incomeDirty = STEP_FIELDS.income.some(
        (field) => !isFieldUnset(field, data[field]),
      );
      if (incomeDirty && !completedRef.current.profile) {
        await updateProfile.mutateAsync({
          employment_status: data.employment_status,
          monthly_income: data.monthly_income,
          income_steadiness: data.income_steadiness,
          dependents_count: data.dependents_count,
        });
        completedRef.current.profile = true;
      }

      // POST /budget (allocations from the chosen template, sum 100), then
      // flip isAuthenticated and go to the dashboard. Falls back to the
      // suggested (or first) template and a zeroed goal if the user skipped
      // those steps — the backend requires both on every budget.
      const fallbackTemplate =
        templates?.find((tpl) => tpl.is_suggested) ?? templates?.[0];
      const template =
        templates?.find((tpl) => tpl.template_key === data.selected_template_key) ??
        fallbackTemplate;
      await createBudget.mutateAsync({
        selected_template_key: template?.template_key ?? "",
        goal: {
          name: data.goal_name || t("onboarding.review.empty"),
          target_amount: Number(data.goal_target_amount) || 0,
          // Backend requires target_months >= 1 — 0 is invalid, so a skipped
          // goal step defaults to 1 rather than sending an out-of-range value.
          target_months: Number(data.goal_target_months) || 1,
        },
        allocations: template?.allocations ?? [],
      });
      reset();
      setPassword("");
      setAgreed(false);
      completedRef.current = { signup: false, profile: false };
      login();
      navigate(`/${lang}/dashboard`);
    } catch {
      // Writes (signup, profile, budget) must NOT fake success. The mutation's
      // onError already surfaced a toast; stay on the current step, don't advance.
      // completedRef retains whichever calls already succeeded so a retry resumes.
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <AuthLayout align="start">
      <div className="flex flex-col gap-5">
        <img src="/logo.webp" alt={t("app.name")} className="mx-auto h-auto w-1/2" />

        <div className="card border-base-300 bg-base-100 border shadow-sm">
          <div className="card-body gap-5 p-5 sm:p-6">
            <div
              className="flex gap-1.5"
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemax={totalSteps}
            >
              {Array.from({ length: totalSteps }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleStepClick(i)}
                  disabled={isStepLocked(i)}
                  aria-label={t(`onboarding.${STEP_KEYS[i]}.title`)}
                  className={`bg-base-300 h-1.5 flex-1 overflow-hidden rounded-full ${
                    isStepLocked(i) ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <div
                    className={`bg-primary h-full rounded-full ease-out ${
                      i === step || i === prevStep
                        ? "transition-transform duration-500"
                        : ""
                    }`}
                    style={{
                      transform: i <= step ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: isRtl ? "right" : "left",
                    }}
                  />
                </button>
              ))}
            </div>

            <div
              key={step}
              style={{ "--step-enter-x": `${enterX}px` } as React.CSSProperties}
              className="flex animate-[step-enter_300ms_ease-out_both] flex-col gap-4"
            >
              <div>
                <h1 className="text-xl font-semibold">
                  {t(`onboarding.${stepKey}.title`)}
                </h1>
                <p className="text-base-content/60 mt-1 text-sm">
                  {t(`onboarding.${stepKey}.subtitle`)}
                </p>
              </div>
              {stepKey === "account" ? (
                <AccountStep
                  password={password}
                  onPasswordChange={setPassword}
                  agreed={agreed}
                  onAgreedChange={setAgreed}
                />
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

            <div className="mt-1 flex items-center justify-between">
              <button
                className="btn btn-ghost gap-1.5"
                disabled={isSubmitting}
                onClick={() => (step === 0 ? navigate(`/${lang}`) : back())}
              >
                <ArrowLeft className="size-4" />
                {t("actions.back")}
              </button>
              <span className={!canContinue ? "cursor-not-allowed" : undefined}>
                <Button
                  className={`btn gap-1.5 ${isSkip ? "btn-outline btn-primary" : "btn-primary"}`}
                  disabled={!canContinue}
                  loading={isSubmitting}
                  onClick={handlePrimary}
                >
                  {isLast ? (
                    <>
                      {t("onboarding.finish")}
                      <Check data-no-flip className="size-4" />
                    </>
                  ) : isSkip ? (
                    <>
                      {t("actions.skip")}
                      <ChevronsRight className="size-4" />
                    </>
                  ) : (
                    <>
                      {t("actions.continue")}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </span>
            </div>
          </div>
        </div>

        {stepKey === "account" && (
          <Link
            to={`/${lang}/sign-in`}
            className="link text-base-content/60 text-center text-sm"
          >
            {t("onboarding.login")}
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
