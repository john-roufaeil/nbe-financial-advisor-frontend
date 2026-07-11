import { useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { PrivacyPolicyModal } from "@/components/shared/PrivacyPolicyModal";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { RequiredMark } from "@/components/onboarding/RequiredMark";

interface AccountFormValues {
  name: string;
  email: string;
  password: string;
  phone: string;
}

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
  onValidityChange,
  emailTaken,
  onEmailChange,
}: {
  password: string;
  onPasswordChange: (value: string) => void;
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
  /** Reports live zod-validity of name/email/password/phone up to the route,
   * which ANDs it with the (schema-external) consent checkbox. */
  onValidityChange: (valid: boolean) => void;
  /** Set by the route when signup failed because this email is already registered. */
  emailTaken: boolean;
  /** Fired on every keystroke in the email field, so the route can clear `emailTaken`. */
  onEmailChange: () => void;
}) {
  const { t } = useTranslation();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);
  const policyRef = useRef<HTMLDialogElement>(null);

  const accountSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("onboarding.account.errors.nameRequired"))
          .max(20, t("onboarding.account.errors.nameTooLong")),
        email: z
          .string()
          .trim()
          .min(1, t("onboarding.account.errors.emailRequired"))
          .email(t("onboarding.account.errors.emailInvalid")),
        password: z.string().min(8, t("onboarding.account.errors.passwordTooShort")),
        phone: z.string().refine((value) => !value || isValidPhoneNumber(value), {
          message: t("onboarding.account.errors.phoneInvalid"),
        }),
      }),
    [t],
  );

  const {
    register,
    control,
    formState: { errors, isValid },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    defaultValues: { name: data.name, email: data.email, password, phone: data.phone },
  });

  useEffect(() => {
    onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.name")}
          <RequiredMark />
        </span>
        <input
          type="text"
          className="input input-bordered w-full"
          maxLength={20}
          {...register("name", {
            onChange: (e) => setField("name", e.target.value),
          })}
        />
        {errors.name && <span className="text-error text-xs">{errors.name.message}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.email")}
          <RequiredMark />
        </span>
        <input
          type="email"
          className={`input input-bordered w-full ${errors.email || emailTaken ? "input-error" : ""}`}
          {...register("email", {
            onChange: (e) => {
              setField("email", e.target.value);
              onEmailChange();
            },
          })}
        />
        {errors.email ? (
          <span className="text-error text-xs">{errors.email.message}</span>
        ) : (
          emailTaken && (
            <span className="text-error text-xs">
              {t("onboarding.account.errors.emailTaken")}
            </span>
          )
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.password")}
          <RequiredMark />
        </span>
        <PasswordInput
          autoComplete="new-password"
          className="input input-bordered w-full"
          {...register("password", {
            onChange: (e) => onPasswordChange(e.target.value),
          })}
        />
        {errors.password ? (
          <span className="text-error text-xs">{errors.password.message}</span>
        ) : (
          <span className="text-base-content/50 text-xs">
            {t("onboarding.account.passwordHint")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("onboarding.account.phone")}</span>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              className="input input-bordered w-full"
              defaultCountry="EG"
              international
              value={field.value}
              onBlur={field.onBlur}
              onChange={(value) => {
                const next = value ?? "";
                field.onChange(next);
                setField("phone", next);
              }}
            />
          )}
        />
        {errors.phone && (
          <span className="text-error text-xs">{errors.phone.message}</span>
        )}
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
