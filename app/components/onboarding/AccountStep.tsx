import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";

/**
 * Password is received as a prop (owned by the onboarding route's local state),
 * never read from or written to the persisted onboarding store — it is only
 * needed for the one-off POST /auth/signup call. See use-onboarding-store.ts.
 */
export function AccountStep({
  password,
  onPasswordChange,
}: {
  password: string;
  onPasswordChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.account.name")}</span>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setField("name", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.account.email")}</span>
        <input
          type="email"
          value={data.email}
          onChange={(e) => setField("email", e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.account.password")}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <span className="text-base-content/50 text-xs">
          {t("onboarding.account.passwordHint")}
        </span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.account.phone")}</span>
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
