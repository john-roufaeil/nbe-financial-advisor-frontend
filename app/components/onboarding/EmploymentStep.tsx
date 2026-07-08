import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";

const EMPLOYMENT_OPTIONS = [
  "employed",
  "selfEmployed",
  "student",
  "unemployed",
  "retired",
] as const;

export function EmploymentStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.employment.status")}</span>
        <select
          value={data.employmentStatus}
          onChange={(e) => setField("employmentStatus", e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          <option value="" disabled>
            {t("onboarding.employment.statusPlaceholder")}
          </option>
          {EMPLOYMENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`onboarding.employment.options.${opt}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.employment.monthlyIncome")}
        </span>
        <input
          type="number"
          min={0}
          value={data.monthlyIncome}
          onChange={(e) => setField("monthlyIncome", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
    </div>
  );
}
