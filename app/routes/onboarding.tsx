import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, ChevronsRight, Check } from "lucide-react";
import {
  useOnboardingStore,
  INITIAL_ONBOARDING_DATA,
} from "@/store/use-onboarding-store";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { AccountStep } from "@/components/onboarding/AccountStep";
import { IncomeStep } from "@/components/onboarding/IncomeStep";
import { GoalStep } from "@/components/onboarding/GoalStep";
import { TemplateStep } from "@/components/onboarding/TemplateStep";
import { ReviewStep } from "@/components/onboarding/ReviewStep";
import { useSignup } from "@/queries/auth";
import { useUpdateProfile } from "@/queries/profile";
import { useStarterTemplates, useCreateBudget } from "@/queries/budget";
import { useCreateGoal } from "@/queries/goals";
import { usePageTitle } from "@/lib/use-page-title";
import { isEmailTakenError } from "@/lib/toast";
import {
  STEP_FIELDS,
  isStepDirty,
  isStepComplete,
  isStepSkippable,
  type OptionalStepKey,
} from "@/lib/onboarding-fields";

const STEP_KEYS = ["account", "income", "goal", "template", "review"] as const;

export default function Onboarding() {
  const { step, totalSteps, next, back, goToStep, reset, data, setField } =
    useOnboardingStore();
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

  // Live zod-validity of the account step's fields (name/email/password/phone),
  // reported up by AccountStep. Consent isn't part of that schema, so it's
  // ANDed in separately below.
  const [accountFieldsValid, setAccountFieldsValid] = useState(false);

  // Set when signup fails because the email is already registered — surfaced
  // as a field error on the account step, cleared as soon as the user edits
  // the email again.
  const [emailTaken, setEmailTaken] = useState(false);

  // Guards against double-submit while a step's async call is in flight. A ref
  // (not state) so it doesn't change how anything renders.
  const submittingRef = useRef(false);

  // Every step's data is held locally until "Create plan" on the final step —
  // no API calls fire before then. If a later call in that sequence fails
  // after an earlier one already succeeded, retrying "Create plan" must not
  // redo the calls that already went through (e.g. signup can't be repeated
  // — the email is already registered), so completed steps are tracked here.
  const completedRef = useRef({ signup: false, profile: false, budget: false });

  const signup = useSignup();
  const updateProfile = useUpdateProfile();
  const createBudget = useCreateBudget();
  const saveGoal = useCreateGoal();
  const isSubmitting =
    signup.isPending ||
    updateProfile.isPending ||
    createBudget.isPending ||
    saveGoal.isPending;
  // Same query (cached) TemplateStep uses — lets the review step read the
  // selected template's allocations for the create-budget call.
  const { data: templates } = useStarterTemplates();

  const prevStepRef = useRef(step);
  const prevStep = prevStepRef.current;
  const direction = step >= prevStep ? 1 : -1;
  prevStepRef.current = step;
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const enterX = 16 * direction * (isRtl ? -1 : 1);

  // The account step is hard-required (name, email, password, consent, and no
  // unresolved "email already registered" conflict — the user must change the
  // email before continuing). Later steps are "all or nothing": Continue only
  // enables once every field on that step is filled in, so a half-filled step
  // can never be submitted. Skip is offered only on the steps that are truly
  // optional (see isStepSkippable) — income and template are not among them.
  const isAccountValid = accountFieldsValid && agreed && !emailTaken;

  const optionalStepKey: OptionalStepKey | null =
    stepKey === "income" || stepKey === "goal" || stepKey === "template" ? stepKey : null;
  const stepIsComplete =
    optionalStepKey !== null && isStepComplete(optionalStepKey, data);

  const canContinue =
    stepKey === "account"
      ? isAccountValid
      : optionalStepKey !== null
        ? stepIsComplete
        : true;

  // Can only jump to a step ahead of the current one if the account step
  // (the one hard gate) has already been satisfied.
  function isStepLocked(target: number) {
    return target > 0 && !isAccountValid && step === 0;
  }

  function handleStepClick(target: number) {
    if (isSubmitting || target === step || isStepLocked(target)) return;
    goToStep(target);
  }

  // "Skip" works on a skippable step even mid-fill — it resets that step's
  // fields back to their defaults first, so the final submit's dirty-check sees
  // a genuinely untouched step rather than a partial one.
  function handleSkip() {
    if (isSubmitting || optionalStepKey === null || !isStepSkippable(optionalStepKey))
      return;
    for (const field of STEP_FIELDS[optionalStepKey]) {
      setField(field, INITIAL_ONBOARDING_DATA[field]);
    }
    next();
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

      if (isStepDirty("income", data) && !completedRef.current.profile) {
        await updateProfile.mutateAsync({
          employment_status: data.employment_status,
          monthly_income: data.monthly_income,
          income_steadiness: data.income_steadiness,
          dependents_count: data.dependents_count,
        });
        completedRef.current.profile = true;
      }

      // Budget and goal are TWO SEPARATE backend entities with separate endpoints.
      // POST /budget carries allocations only; the goal goes to PATCH /dashboard/goal
      // (an upsert). Sending `goal` inside the budget body silently drops it.
      const fallbackTemplate =
        templates?.find((tpl) => tpl.is_suggested) ?? templates?.[0];
      const template =
        templates?.find((tpl) => tpl.template_key === data.selected_template_key) ??
        fallbackTemplate;

      if (!completedRef.current.budget) {
        await createBudget.mutateAsync({
          selected_template_key: template?.template_key ?? "",
          allocations: template?.allocations ?? [],
        });
        completedRef.current.budget = true;
      }

      // Only create a goal if the user actually entered one. A skipped goal step
      // means "no goal", not "a goal named empty-string worth 0".
      if (data.goal_name.trim() && Number(data.goal_target_amount) > 0) {
        await saveGoal.mutateAsync({
          name: data.goal_name,
          target: Number(data.goal_target_amount),
          // Backend requires target_months >= 1.
          duration: Number(data.goal_target_months) || 1,
          current: 0,
        });
      }
      reset();
      setPassword("");
      setAgreed(false);
      completedRef.current = { signup: false, profile: false, budget: false };
      navigate(`/${lang}/sign-in`);
    } catch (error) {
      // Writes (signup, profile, budget) must NOT fake success. The mutation's
      // onError already surfaced a toast; stay on the current step, don't advance.
      // completedRef retains whichever calls already succeeded so a retry resumes.
      // A signup-specific "email already registered" failure additionally sends
      // the user back to the account step to fix the email.
      if (!completedRef.current.signup && isEmailTakenError(error)) {
        setEmailTaken(true);
        goToStep(0);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <AuthLayout align="start">
      <div className="flex flex-col gap-5">
        <img
          src="/logo.webp"
          alt={t("app.name")}
          className="mx-auto h-auto w-1/2 max-w-50"
        />

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
                  className={`flex min-h-11 flex-1 items-center py-1 ${
                    isStepLocked(i) ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <span className="bg-base-300 h-1.5 w-full overflow-hidden rounded-full">
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
                  </span>
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
                  onValidityChange={setAccountFieldsValid}
                  emailTaken={emailTaken}
                  onEmailChange={() => setEmailTaken(false)}
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
              <div className="flex items-center gap-2">
                {optionalStepKey !== null && isStepSkippable(optionalStepKey) && (
                  <button
                    type="button"
                    className="btn btn-ghost gap-1.5"
                    disabled={isSubmitting}
                    onClick={handleSkip}
                  >
                    {t("actions.skip")}
                    <ChevronsRight className="size-4" />
                  </button>
                )}
                <Tooltip
                  content={
                    !canContinue && optionalStepKey !== null
                      ? t("onboarding.errors.fillAllRequired")
                      : ""
                  }
                >
                  <Button
                    className="btn btn-primary gap-1.5"
                    disabled={!canContinue}
                    loading={isSubmitting}
                    onClick={handlePrimary}
                  >
                    {isLast ? (
                      <>
                        {t("onboarding.finish")}
                        <Check data-no-flip className="size-4" />
                      </>
                    ) : (
                      <>
                        {t("actions.continue")}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {stepKey === "account" && (
          <Link
            to={`/${lang}/sign-in`}
            className="text-base-content/60 btn btn-ghost text-center text-sm"
          >
            {t("onboarding.login")}
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
