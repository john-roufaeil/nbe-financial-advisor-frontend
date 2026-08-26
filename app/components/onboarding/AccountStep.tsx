import { useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { PrivacyPolicyModal } from "@/components/shared/modals/PrivacyPolicyModal";
import { PasswordInput } from "@/components/shared/forms/PasswordInput";
import { RequiredMark } from "@/components/onboarding/RequiredMark";
import { NAME_PATTERN } from "@/lib/name-validation";
import { PHONE_PATTERN } from "@/lib/phone-validation";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

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
  dataProcessingAgreed,
  onDataProcessingAgreedChange,
  onValidityChange,
  emailTaken,
  onEmailChange,
}: {
  password: string;
  onPasswordChange: (value: string) => void;
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
  /** Optional — declining it just skips granting data_processing at signup
   * (see onboarding.tsx), it doesn't block account creation. */
  dataProcessingAgreed: boolean;
  onDataProcessingAgreedChange: (value: boolean) => void;
  /** Reports live zod-validity of name/email/password/phone up to the route,
   * which ANDs it with the (schema-external) terms_of_service checkbox —
   * data_processing is optional, so it's never part of this. */
  onValidityChange: (valid: boolean) => void;
  /** Set by the route when signup failed because this email is already registered. */
  emailTaken: boolean;
  /** Fired on every keystroke in the email field, so the route can clear `emailTaken`. */
  onEmailChange: () => void;
}) {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);
  const termsPolicyRef = useRef<HTMLDialogElement>(null);
  const dataPolicyRef = useRef<HTMLDialogElement>(null);

  const accountSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("onboarding.account.errors.nameRequired"))
          .max(20, t("onboarding.account.errors.nameTooLong"))
          .regex(NAME_PATTERN, t("onboarding.account.errors.nameInvalid")),
        email: z
          .string()
          .trim()
          .min(1, t("onboarding.account.errors.emailRequired"))
          .email(t("onboarding.account.errors.emailInvalid")),
        password: z.string().min(8, t("onboarding.account.errors.passwordTooShort")),
        phone: z
          .string()
          .trim()
          .min(1, t("onboarding.account.errors.phoneRequired"))
          .regex(PHONE_PATTERN, t("onboarding.account.errors.phoneInvalid")),
      }),
    [t],
  );

  const {
    register,
    control,
    formState: { errors, isValid, touchedFields },
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
          id="account-name"
          className="input input-bordered w-full"
          maxLength={20}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "account-name-error" : undefined}
          {...register("name", {
            onChange: (e) => setField("name", e.target.value),
          })}
        />
        {touchedFields.name && errors.name && (
          <span id="account-name-error" role="alert" className="text-error text-xs">
            {errors.name.message}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.email")}
          <RequiredMark />
        </span>
        <input
          type="email"
          id="account-email"
          className={`input input-bordered w-full ${errors.email || emailTaken ? "input-error" : ""}`}
          aria-invalid={!!errors.email || emailTaken}
          aria-describedby={
            errors.email || emailTaken ? "account-email-error" : undefined
          }
          {...register("email", {
            onChange: (e) => {
              setField("email", e.target.value);
              onEmailChange();
            },
          })}
        />
        {touchedFields.email && errors.email ? (
          <span id="account-email-error" role="alert" className="text-error text-xs">
            {errors.email.message}
          </span>
        ) : (
          emailTaken && (
            <span
              id="account-email-error"
              role="alert"
              className="text-error flex flex-wrap items-center gap-x-1 text-xs"
            >
              {t("onboarding.account.errors.emailTaken")}
              <Link
                to={localizedPath(lang ?? "en", ROUTE_SEGMENTS.signIn)}
                state={{ email: data.email }}
                className="link link-primary"
              >
                {t("onboarding.account.errors.signInInstead")}
              </Link>
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
          id="account-password"
          autoComplete="new-password"
          className="input input-bordered w-full"
          aria-invalid={!!errors.password}
          aria-describedby="account-password-hint"
          {...register("password", {
            onChange: (e) => onPasswordChange(e.target.value),
          })}
        />
        {touchedFields.password && errors.password ? (
          <span id="account-password-hint" role="alert" className="text-error text-xs">
            {errors.password.message}
          </span>
        ) : (
          <span id="account-password-hint" className="text-base-content/50 text-xs">
            {t("onboarding.account.passwordHint")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("onboarding.account.phone")}
          <RequiredMark />
        </span>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="account-phone"
              className="input input-bordered w-full"
              defaultCountry="EG"
              international
              flags={flags}
              value={field.value}
              onBlur={field.onBlur}
              aria-invalid={touchedFields.phone && !!errors.phone}
              aria-describedby={
                touchedFields.phone && errors.phone ? "account-phone-error" : undefined
              }
              onChange={(value) => {
                const next = value ?? "";
                field.onChange(next);
                setField("phone", next);
              }}
            />
          )}
        />
        {touchedFields.phone && errors.phone && (
          <span id="account-phone-error" role="alert" className="text-error text-xs">
            {errors.phone.message}
          </span>
        )}
      </label>
      <div className="mt-1 flex flex-row flex-nowrap items-center gap-3">
        <label
          htmlFor="consent-agree"
          className="relative -m-3 flex shrink-0 cursor-pointer items-center justify-center p-3"
        >
          <input
            id="consent-agree"
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={agreed}
            onChange={(e) => onAgreedChange(e.target.checked)}
          />
        </label>
        <p className="text-base-content/70 flex flex-1 flex-wrap items-center gap-x-1 text-sm">
          <label htmlFor="consent-agree" className="cursor-pointer">
            {t("consent.agreePrefix")}
          </label>
          <button
            type="button"
            onClick={() => termsPolicyRef.current?.showModal()}
            className="link hover:text-primary cursor-pointer p-0 align-baseline text-sm"
          >
            {t("consent.termsLink")}
          </button>
          <RequiredMark />
        </p>
      </div>

      <div className="flex flex-row flex-nowrap items-center gap-3">
        <label
          htmlFor="consent-data-processing"
          className="relative -m-3 flex shrink-0 cursor-pointer items-center justify-center p-3"
        >
          <input
            id="consent-data-processing"
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={dataProcessingAgreed}
            onChange={(e) => onDataProcessingAgreedChange(e.target.checked)}
          />
        </label>
        <p className="text-base-content/70 flex flex-1 flex-wrap items-center gap-x-1 text-sm">
          <label htmlFor="consent-data-processing" className="cursor-pointer">
            {t("consent.dataProcessingAgreePrefix")}
          </label>
          <button
            type="button"
            onClick={() => dataPolicyRef.current?.showModal()}
            className="link hover:text-primary cursor-pointer p-0 align-baseline text-sm"
          >
            {t("consent.dataProcessingLink")}
          </button>
          <span className="text-base-content/50">
            {t("consent.dataProcessingOptional")}
          </span>
        </p>
      </div>

      <PrivacyPolicyModal ref={termsPolicyRef} type="terms_of_service" />
      <PrivacyPolicyModal ref={dataPolicyRef} type="data_processing" />
    </div>
  );
}
