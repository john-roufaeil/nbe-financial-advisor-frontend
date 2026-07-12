import { useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { PrivacyPolicyModal } from "@/components/shared/modals/PrivacyPolicyModal";
import { PasswordInput } from "@/components/shared/forms/PasswordInput";
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
          id="account-name"
          className="input input-bordered w-full"
          maxLength={20}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "account-name-error" : undefined}
          {...register("name", {
            onChange: (e) => setField("name", e.target.value),
          })}
        />
        {errors.name && (
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
        {errors.email ? (
          <span id="account-email-error" role="alert" className="text-error text-xs">
            {errors.email.message}
          </span>
        ) : (
          emailTaken && (
            <span id="account-email-error" role="alert" className="text-error text-xs">
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
          id="account-password"
          autoComplete="new-password"
          className="input input-bordered w-full"
          aria-invalid={!!errors.password}
          aria-describedby="account-password-hint"
          {...register("password", {
            onChange: (e) => onPasswordChange(e.target.value),
          })}
        />
        {errors.password ? (
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
        <span className="label-text text-xs">{t("onboarding.account.phone")}</span>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="account-phone"
              className="input input-bordered w-full"
              defaultCountry="EG"
              international
              value={field.value}
              onBlur={field.onBlur}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "account-phone-error" : undefined}
              onChange={(value) => {
                const next = value ?? "";
                field.onChange(next);
                setField("phone", next);
              }}
            />
          )}
        />
        {errors.phone && (
          <span id="account-phone-error" role="alert" className="text-error text-xs">
            {errors.phone.message}
          </span>
        )}
      </label>
      <div className="mt-1 flex flex-row flex-nowrap items-center gap-3">
        {/* p-3 -m-3 expands the tap target to ~44px (WCAG 2.5.8) without the
            box itself taking up 44px of layout height — a plain min-h-11
            here made this row's own whitespace read as a much bigger gap
            than the gap-4 between every other field, since the tiny
            checkbox glyph sat lost in the middle of a 44px-tall box. */}
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
            onClick={() => policyRef.current?.showModal()}
            className="link hover:text-primary cursor-pointer p-0 align-baseline text-sm"
          >
            {t("consent.termsLink")}
          </button>
        </p>
      </div>

      <PrivacyPolicyModal ref={policyRef} />
    </div>
  );
}
