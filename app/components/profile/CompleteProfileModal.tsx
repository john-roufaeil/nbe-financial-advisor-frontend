import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { ChipPicker } from "@/components/onboarding/ChipPicker";
import { SliderField } from "@/components/onboarding/SliderField";
import { useCompleteProfileModalStore } from "@/store/use-complete-profile-modal-store";
import { useUpdateProfile } from "@/queries/profile";
import { isFieldUnset } from "@/lib/onboarding-fields";
import { EMPLOYMENT_OPTIONS, STEADINESS_OPTIONS } from "@/lib/constants/options";
import {
  MONTHLY_INCOME_MIN,
  MONTHLY_INCOME_MAX,
  MONTHLY_INCOME_STEP,
  DEPENDENTS_MIN,
  DEPENDENTS_MAX,
} from "@/lib/constants/limits";

/**
 * Welcoming, non-dismissible gate for an authenticated user with no
 * employment status yet — a bank-login account (never touched onboarding at
 * all) or a normal account whose profile step never landed. Same four fields
 * as onboarding's IncomeStep; only employment_status/monthly_income are
 * mandatory to submit (dependents/steadiness stay optional here too, same as
 * onboarding — zero dependents is a real answer, not a missing one). Unlike a
 * plain nudge, this one has no header X, no backdrop dismiss, and no Escape
 * close (BaseModal `dismissible={false}`) — the only way out is a valid
 * submit.
 */
export function CompleteProfileModal() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const isOpen = useCompleteProfileModalStore((s) => s.isOpen);
  const close = useCompleteProfileModalStore((s) => s.close);
  const updateProfile = useUpdateProfile();

  const [employmentStatus, setEmploymentStatus] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [dependentsCount, setDependentsCount] = useState("0");
  const [incomeSteadiness, setIncomeSteadiness] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);

  const statusMissing =
    attempted && isFieldUnset("employment_status", employmentStatus)
      ? t("onboarding.income.errors.statusRequired")
      : undefined;
  const incomeMissing =
    attempted && isFieldUnset("monthly_income", monthlyIncome)
      ? t("onboarding.income.errors.monthlyIncomeRequired")
      : undefined;

  async function handleSave() {
    if (
      isFieldUnset("employment_status", employmentStatus) ||
      isFieldUnset("monthly_income", monthlyIncome)
    ) {
      setAttempted(true);
      return;
    }
    try {
      await updateProfile.mutateAsync({
        employment_status: employmentStatus,
        monthly_income: monthlyIncome,
        dependents_count: dependentsCount,
        income_steadiness: incomeSteadiness,
      });
      close();
    } catch {
      // onError already toasted; keep the modal open with the entered values.
    }
  }

  return (
    <BaseModal
      ref={ref}
      dismissible={false}
      title={t("common.completeProfile.title")}
      icon={
        <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-full">
          <Sparkles className="size-5" />
        </span>
      }
      actions={
        <Button
          type="button"
          onClick={handleSave}
          loading={updateProfile.isPending}
          className="btn btn-primary"
        >
          {t("actions.submit")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-base-content/60 text-sm">
          {t("common.completeProfile.description")}
        </p>
        <p className="text-base-content/40 text-xs">
          {t("common.completeProfile.required")}
        </p>

        <ChipPicker
          label={t("onboarding.income.status")}
          options={EMPLOYMENT_OPTIONS.map((opt) => ({
            value: opt,
            label: t(`onboarding.income.options.${opt}`),
          }))}
          value={employmentStatus}
          onChange={setEmploymentStatus}
          error={statusMissing}
          required
        />

        <SliderField
          label={t("onboarding.income.dependents")}
          value={Number(dependentsCount) || 0}
          onChange={(v) => setDependentsCount(String(v))}
          min={DEPENDENTS_MIN}
          max={DEPENDENTS_MAX}
          step={1}
          unit={t("onboarding.income.personUnit", {
            count: Number(dependentsCount) || 0,
          })}
          info={t("onboarding.income.dependentsInfo")}
        />

        <SliderField
          label={t("onboarding.income.monthlyIncome")}
          value={Number(monthlyIncome) || 0}
          onChange={(v) => setMonthlyIncome(String(v))}
          min={MONTHLY_INCOME_MIN}
          max={MONTHLY_INCOME_MAX}
          step={MONTHLY_INCOME_STEP}
          unit={t("currency.EGP")}
          error={incomeMissing}
          required
        />

        <ChipPicker
          label={t("onboarding.income.steadiness")}
          options={STEADINESS_OPTIONS.map((opt) => ({
            value: opt,
            label: t(`onboarding.income.steadinessOptions.${opt}`),
          }))}
          value={incomeSteadiness}
          onChange={setIncomeSteadiness}
        />
      </div>
    </BaseModal>
  );
}
