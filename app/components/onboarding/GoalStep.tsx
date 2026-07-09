import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";

/**
 * Maps to the `goal` object of POST /budget:
 *   goal_name          -> goal.name
 *   goal_target_amount -> goal.target_amount
 *   goal_target_months -> goal.target_months
 * No API call on this step — the goal is held in form state until step 5.
 */
export function GoalStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.goal.name")}</span>
        <input
          type="text"
          value={data.goal_name}
          onChange={(e) => setField("goal_name", e.target.value)}
          placeholder={t("onboarding.goal.namePlaceholder")}
          className="input input-bordered input-sm w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.goal.targetAmount")}</span>
        <input
          type="number"
          min={0}
          value={data.goal_target_amount}
          onChange={(e) => setField("goal_target_amount", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.goal.targetMonths")}</span>
        <input
          type="number"
          min={1}
          value={data.goal_target_months}
          onChange={(e) => setField("goal_target_months", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
    </div>
  );
}
