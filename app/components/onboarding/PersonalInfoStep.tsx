import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";

export function PersonalInfoStep() {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.personalInfo.fullName")}
        </span>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.personalInfo.email")}</span>
        <input
          type="email"
          value={data.email}
          onChange={(e) => setField("email", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.personalInfo.phone")}</span>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => setField("phone", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
    </div>
  );
}
