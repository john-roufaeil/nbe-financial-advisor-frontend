import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { ChipPicker } from "@/components/onboarding/ChipPicker";
import { SliderField } from "@/components/onboarding/SliderField";
import { useCompleteProfileModalStore } from "@/store/use-complete-profile-modal-store";
import { useUpdateProfile } from "@/queries/profile";
import { isFieldUnset } from "@/lib/onboarding-fields";
import { EMPLOYMENT_OPTIONS } from "@/lib/constants/options";
import {
  MONTHLY_INCOME_MIN,
  MONTHLY_INCOME_MAX,
  MONTHLY_INCOME_STEP,
} from "@/lib/constants/limits";

/**
 * One-time post-login nudge for an authenticated user with no employment
 * status yet — a bank-login account (never touched onboarding at all) or a
 * normal account whose profile step never landed. Only the two mandatory
 * income-step fields; dependents/steadiness stay optional and editable later
 * from the profile page. Dismissible (BaseModal's own close X/backdrop) since
 * this is a nudge, not a gate — nothing else in the app blocks on it.
 */
export function CompleteProfileModal() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const isOpen = useCompleteProfileModalStore((s) => s.isOpen);
  const close = useCompleteProfileModalStore((s) => s.close);
  const updateProfile = useUpdateProfile();

  const [employmentStatus, setEmploymentStatus] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("0");
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
      });
      close();
    } catch {
      // onError already toasted; keep the modal open with the entered values.
    }
  }

  return (
    <BaseModal
      ref={ref}
      onClose={close}
      title={t("common.completeProfile.title")}
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
      </div>
    </BaseModal>
  );
}
