import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, ChevronsRight, Check, Info } from "lucide-react";
import {
  useOnboardingStore,
  INITIAL_ONBOARDING_DATA,
  type OnboardingData,
} from "@/store/use-onboarding-store";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { AccountStep } from "@/components/onboarding/AccountStep";
import { IncomeStep } from "@/components/onboarding/IncomeStep";
import { GoalStep } from "@/components/onboarding/GoalStep";
import { TemplateStep } from "@/components/onboarding/TemplateStep";
import { PlanSummary } from "@/components/onboarding/PlanSummary";
import { useSignup } from "@/queries/auth";
import { useUpdateProfile } from "@/queries/profile";
import { useStarterTemplates, useCreateBudget } from "@/queries/budget";
import { useCreateGoal } from "@/queries/goals";
import { useGrantConsent } from "@/queries/consent";
import { CONSENT_TYPES, CURRENT_POLICY_VERSION } from "@/types/consent";
import { usePageTitle } from "@/lib/use-page-title";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import { isEmailTakenError } from "@/lib/toast";
import {
  STEP_FIELDS,
  isStepDirty,
  isStepComplete,
  isStepSkippable,
  type OptionalStepKey,
} from "@/lib/onboarding-fields";

// Account is last on purpose: the signup call already fires only once, at
// the very end (see handlePrimary below), regardless of display order — so
// asking for name/email/password only after the user has configured
// income/goal/template lets them see the shape of their plan before being
// asked to commit to it.
const STEP_KEYS = ["income", "goal", "template", "account"] as const;
const ACCOUNT_STEP_INDEX = STEP_KEYS.indexOf("account");

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
  // terms_of_service is mandatory (ANDed into isAccountValid below);
  // data_processing is its own optional checkbox — declining it just means
  // signup skips granting that type, leaving the account in the same
  // "no active data_processing consent" state HasDataProcessingConsent
  // gates on, rather than forcing every account to start with it granted.
  const [agreed, setAgreed] = useState(false);
  const [dataProcessingAgreed, setDataProcessingAgreed] = useState(false);

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
  const [attempted, setAttempted] = useState(false);

  // Set when the user clicks a field's "edit" affordance on PlanSummary (the
  // account step's recap of income/goal/template) — the target step scrolls
  // that field into view and rings it briefly, then this clears itself.
  const [highlightField, setHighlightField] = useState<keyof OnboardingData | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    },
    [],
  );
  function handleEditField(target: OptionalStepKey, field: keyof OnboardingData) {
    goToStep(STEP_KEYS.indexOf(target));
    setHighlightField(field);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightField(null), 2000);
  }

  // Every step's data is held locally until "Create plan" on the final step —
  // no API calls fire before then. If a later call in that sequence fails
  // after an earlier one already succeeded, retrying "Create plan" must not
  // redo the calls that already went through (e.g. signup can't be repeated
  // — the email is already registered), so completed steps are tracked here.
  const completedRef = useRef({
    signup: false,
    consent: false,
    profile: false,
    budget: false,
  });

  const signup = useSignup();
  const grantConsent = useGrantConsent();
  const updateProfile = useUpdateProfile();
  const createBudget = useCreateBudget();
  const saveGoal = useCreateGoal();
  const isSubmitting =
    signup.isPending ||
    grantConsent.isPending ||
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

  // Same gate Continue itself uses, but for an arbitrary step index rather
  // than just the current one — lets the tab bar check every step between
  // here and a target ahead, not only the one currently on screen.
  function stepCanContinue(index: number): boolean {
    const key = STEP_KEYS[index];
    if (key === "account") return isAccountValid;
    if (key === "income" || key === "goal" || key === "template") {
      // A skippable step (goal) never blocks tab navigation regardless of
      // fill state — Skip is always available on it, so requiring it to be
      // *complete* just to jump past would make tab-jumping stricter than
      // Skip itself. Continue's own gate (`canContinue` above) is separate
      // and still requires full completion there.
      return isStepSkippable(key) || isStepComplete(key, data);
    }
    return true;
  }

  // Steps before the current one are already resolved — either completed or
  // explicitly skipped — via Continue/Skip, so revisiting them is always
  // allowed (no blocker). Jumping ahead of the current step, to any distance,
  // is allowed exactly as far as every step from here up to (but not
  // including) the target is itself valid: e.g. from step 1 (valid) you can
  // reach step 2, but not step 3 if step 2 has missing data — in which case
  // this returns step 2's index, not step 3's, so callers can point at the
  // actual problem rather than just the destination.
  function firstBlockingStep(target: number): number | null {
    if (target <= step) return null;
    for (let i = step; i < target; i++) {
      if (!stepCanContinue(i)) return i;
    }
    return null;
  }

  function handleStepClick(target: number) {
    if (isSubmitting || target === step) return;
    const blocker = firstBlockingStep(target);
    if (blocker !== null) {
      if (blocker !== step) goToStep(blocker);
      return;
    }
    goToStep(target);
    setAttempted(false);
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
    setAttempted(false);
  }

  async function handlePrimary() {
    if (submittingRef.current) return;
    if (!canContinue) {
      // Reveals each step's specific "missing" messages (see IncomeStep,
      // GoalStep) — without this, clicking Continue on an incomplete step
      // silently did nothing, since nothing else in this file ever sets
      // `attempted` to true.
      setAttempted(true);
      return;
    }
    submittingRef.current = true;
    try {
      if (!isLast) {
        // Steps 1-4 → no API calls. Everything is held in local/store state
        // until "Create plan" on the final step.
        next();
        setAttempted(false);
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

      // terms_of_service is mandatory (isAccountValid already required
      // `agreed`); data_processing only grants if its own optional checkbox
      // was checked — a decline here just leaves the account without an
      // active data_processing consent record, same state a later revoke
      // produces. Needs the just-issued access token, hence after signup —
      // this endpoint 401s for an unauthenticated caller.
      if (!completedRef.current.consent) {
        const typesToGrant = dataProcessingAgreed
          ? CONSENT_TYPES
          : CONSENT_TYPES.filter((consentType) => consentType !== "data_processing");
        await Promise.all(
          typesToGrant.map((consentType) =>
            grantConsent.mutateAsync({
              consentType,
              policyVersion: CURRENT_POLICY_VERSION,
            }),
          ),
        );
        completedRef.current.consent = true;
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
      completedRef.current = {
        signup: false,
        consent: false,
        profile: false,
        budget: false,
      };
      navigate(localizedPath(lang!, ROUTE_SEGMENTS.signIn), {
        state: { justSignedUp: true },
      });
    } catch (error) {
      // Writes (signup, profile, budget) must NOT fake success. The mutation's
      // onError already surfaced a toast; stay on the current step, don't advance.
      // completedRef retains whichever calls already succeeded so a retry resumes.
      // A signup-specific "email already registered" failure additionally sends
      // the user back to the account step to fix the email.
      if (!completedRef.current.signup && isEmailTakenError(error)) {
        setEmailTaken(true);
        goToStep(ACCOUNT_STEP_INDEX);
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
              role="tablist"
              aria-label={t("onboarding.progressLabel")}
            >
              {Array.from({ length: totalSteps }, (_, i) => {
                const blocker = i > step ? firstBlockingStep(i) : null;
                const locked = blocker !== null;
                const tabTooltip =
                  i === step
                    ? ""
                    : locked
                      ? t("onboarding.errors.completeStepFirst", {
                          step: t(`onboarding.${STEP_KEYS[blocker]}.title`),
                        })
                      : t("onboarding.skipToStep", {
                          step: t(`onboarding.${STEP_KEYS[i]}.title`),
                        });
                return (
                  <Tooltip key={i} content={tabTooltip} className="min-w-0 flex-1">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={i === step}
                      aria-current={i === step ? "step" : undefined}
                      onClick={() => handleStepClick(i)}
                      aria-disabled={locked}
                      aria-label={t(`onboarding.${STEP_KEYS[i]}.title`)}
                      className={`flex min-h-11 min-w-0 flex-1 items-center py-1 ${
                        locked ? "cursor-not-allowed" : "cursor-pointer"
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
                  </Tooltip>
                );
              })}
            </div>

            <div
              key={step}
              style={{ "--step-enter-x": `${enterX}px` } as React.CSSProperties}
              className="flex animate-[step-enter_300ms_ease-out_both] flex-col gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">
                    {t(`onboarding.${stepKey}.title`)}
                  </h1>
                  {optionalStepKey !== null && isStepSkippable(optionalStepKey) && (
                    <span className="badge badge-ghost badge-sm text-base-content/50 font-normal">
                      {t("onboarding.optionalBadge")}
                    </span>
                  )}
                </div>
                <p className="text-base-content/60 mt-1 flex items-start gap-1.5 text-sm">
                  <span>{t(`onboarding.${stepKey}.subtitle`)}</span>
                  <Tooltip content={t(`onboarding.${stepKey}.why`)}>
                    <button
                      type="button"
                      aria-label={t(`onboarding.${stepKey}.why`)}
                      className="text-base-content/40 hover:text-primary mt-0.5 inline-flex shrink-0"
                    >
                      <Info data-no-flip className="size-3.5" />
                    </button>
                  </Tooltip>
                </p>
              </div>
              {stepKey === "account" ? (
                <>
                  <PlanSummary onEdit={handleEditField} />
                  <AccountStep
                    password={password}
                    onPasswordChange={setPassword}
                    agreed={agreed}
                    onAgreedChange={setAgreed}
                    dataProcessingAgreed={dataProcessingAgreed}
                    onDataProcessingAgreedChange={setDataProcessingAgreed}
                    onValidityChange={setAccountFieldsValid}
                    emailTaken={emailTaken}
                    onEmailChange={() => setEmailTaken(false)}
                  />
                </>
              ) : stepKey === "income" ? (
                <IncomeStep attempted={attempted} highlightField={highlightField} />
              ) : stepKey === "goal" ? (
                <GoalStep attempted={attempted} highlightField={highlightField} />
              ) : (
                <TemplateStep highlightField={highlightField} />
              )}
            </div>

            <div className="mt-1 flex items-center justify-between">
              <button
                className="btn btn-ghost group gap-1.5"
                disabled={isSubmitting}
                onClick={() => {
                  setAttempted(false);
                  if (step === 0) navigate(localizedPath(lang!));
                  else back();
                }}
              >
                <ArrowLeft className="size-4 transition-transform ltr:group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
                {t("actions.back")}
              </button>
              <div className="flex items-center gap-2">
                {optionalStepKey !== null && isStepSkippable(optionalStepKey) && (
                  <button
                    type="button"
                    className="btn btn-ghost group gap-1.5"
                    disabled={isSubmitting}
                    onClick={handleSkip}
                  >
                    {t("actions.skip")}
                    <ChevronsRight className="size-4 transition-transform ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </button>
                )}
                <Tooltip
                  content={
                    canContinue
                      ? ""
                      : stepKey === "account"
                        ? t("onboarding.errors.fillAccountRequired")
                        : optionalStepKey === "income"
                          ? t("onboarding.errors.fillIncomeRequired")
                          : t("onboarding.errors.fillAllRequired")
                  }
                >
                  <Button
                    className={`btn btn-primary group gap-1.5 ${
                      canContinue ? "" : "cursor-not-allowed opacity-50"
                    }`}
                    aria-disabled={!canContinue}
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
                        <ArrowRight className="size-4 transition-transform ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {step === 0 && (
          <Link
            to={localizedPath(lang!, ROUTE_SEGMENTS.signIn)}
            className="text-base-content/60 btn btn-ghost text-center text-sm"
          >
            {t("onboarding.login")}
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
