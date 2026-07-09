import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { PrivacyPolicyModal } from "@/components/shared/PrivacyPolicyModal";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { RequiredMark } from "@/components/onboarding/RequiredMark";

/**
 * Password and consent are received as props (owned by the onboarding route's
 * local state), never read from or written to the persisted onboarding store —
 * the password is only needed for the one-off POST /auth/signup call, and
 * consent is a per-session acknowledgement. See use-onboarding-store.ts.
 */
export function AccountStep({
  password,
  onPasswordChange,
  agreed,
  onAgreedChange,
}: {
  password: string;
  onPasswordChange: (value: string) => void;
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);
  const policyRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.name")}
          <RequiredMark />
        </span>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setField("name", e.target.value)}
          className="input input-bordered w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.email")}
          <RequiredMark />
        </span>
        <input
          type="email"
          value={data.email}
          onChange={(e) => setField("email", e.target.value)}
          className="input input-bordered w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.password")}
          <RequiredMark />
        </span>
        <PasswordInput
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="input input-bordered w-full"
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
          className="input input-bordered w-full"
        />
      </label>
      <div className="mt-1 flex items-start gap-3">
        <input
          id="consent-agree"
          type="checkbox"
          className="checkbox checkbox-primary checkbox-sm mt-0.5"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
        />
        <p className="text-base-content/70 flex flex-wrap items-center gap-x-1 text-sm">
          <label htmlFor="consent-agree" className="cursor-pointer">
            {t("consent.agreePrefix")}
          </label>
          <button
            type="button"
            onClick={() => policyRef.current?.showModal()}
            className="link hover:text-primary p-0 align-baseline text-sm"
          >
            {t("consent.termsLink")}
          </button>
        </p>
      </div>

      <PrivacyPolicyModal ref={policyRef} />
    </div>
  );
}
