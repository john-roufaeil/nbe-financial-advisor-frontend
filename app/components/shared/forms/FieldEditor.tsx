import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { MAX_MONEY_VALUE } from "@/lib/format";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";

/** Describes one editable field in a dynamic, RHF-backed form — e.g. a
 * profile section's set of editable attributes. Keyed by the record's field
 * name so a single generic form (Record<string, string>) can render and
 * validate a variable set of fields per section/entity. */
export type FormFieldConfig<Key extends string = string> = {
  key: Key;
  labelKey: string;
  writable: boolean;
  currency?: boolean;
  /** Plain numeric stepper (e.g. a headcount) — same MoneyInput control as
   * `currency` but with no currency unit appended. */
  count?: boolean;
  /** Ceiling for `currency`/`count` fields. Defaults to MAX_MONEY_VALUE. */
  max?: number;
  /** +/- step size for `currency`/`count` fields. Defaults to MoneyInput's own (1). */
  step?: number;
  ltr?: boolean;
  phone?: boolean;
  placeholderKey?: string;
  options?: { value: string; labelKey: string }[];
};

type Draft = Record<string, string>;

/** Renders the writable control for a `FormFieldConfig` — select/phone/text —
 * bound to an `useForm<Record<string, string>>` via the given control/register. */
export function FieldEditor({
  field,
  control,
  register,
  errors,
}: {
  field: FormFieldConfig;
  control: Control<Draft>;
  register: UseFormRegister<Draft>;
  errors: FieldErrors<Draft>;
}) {
  const { t } = useTranslation();
  const key = field.key;
  const error = errors[key]?.message as string | undefined;

  if (field.options) {
    const options = field.options;
    return (
      <Controller
        name={key}
        control={control}
        render={({ field: rhfField }) => (
          <select
            value={rhfField.value}
            onChange={(e) => rhfField.onChange(e.target.value)}
            className="select select-sm select-bordered w-full"
          >
            <option value="" disabled>
              {t("onboarding.review.empty")}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        )}
      />
    );
  }

  if (field.phone) {
    return (
      <>
        <Controller
          name={key}
          control={control}
          render={({ field: rhfField }) => (
            <PhoneInput
              className={`input input-sm input-bordered w-full ${error ? "input-error" : ""}`}
              defaultCountry="EG"
              international
              flags={flags}
              value={rhfField.value}
              onChange={(next) => rhfField.onChange(next ?? "")}
              placeholder={t(field.placeholderKey ?? field.labelKey)}
            />
          )}
        />
        {error && <span className="text-error text-xs">{error}</span>}
      </>
    );
  }

  if (field.currency || field.count) {
    return (
      <>
        <Controller
          name={key}
          control={control}
          render={({ field: rhfField }) => (
            <MoneyInput
              value={rhfField.value === "" ? "" : Number(rhfField.value)}
              onChange={(v) => rhfField.onChange(v === "" ? "" : String(v))}
              max={field.max ?? MAX_MONEY_VALUE}
              step={field.step}
              unit={field.currency ? t("currency.EGP") : undefined}
              placeholder={t(field.placeholderKey ?? field.labelKey)}
              aria-label={t(field.labelKey)}
              className={`input-sm w-full ${error ? "input-error" : ""}`}
            />
          )}
        />
        {error && <span className="text-error text-xs">{error}</span>}
      </>
    );
  }

  return (
    <>
      <input
        type="text"
        placeholder={t(field.placeholderKey ?? field.labelKey)}
        maxLength={field.key === "name" ? 20 : undefined}
        className={`input input-sm input-bordered w-full ${error ? "input-error" : ""}`}
        {...register(key)}
      />
      {error && <span className="text-error text-xs">{error}</span>}
    </>
  );
}
