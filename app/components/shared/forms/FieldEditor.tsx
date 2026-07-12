import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { MAX_MONEY_VALUE } from "@/lib/format";

/** Describes one editable field in a dynamic, RHF-backed form — e.g. a
 * profile section's set of editable attributes. Keyed by the record's field
 * name so a single generic form (Record<string, string>) can render and
 * validate a variable set of fields per section/entity. */
export type FormFieldConfig<Key extends string = string> = {
  key: Key;
  labelKey: string;
  writable: boolean;
  currency?: boolean;
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

  return (
    <>
      <input
        type={field.currency ? "number" : "text"}
        min={field.currency ? 0 : undefined}
        max={field.currency ? MAX_MONEY_VALUE : undefined}
        placeholder={t(field.placeholderKey ?? field.labelKey)}
        maxLength={field.key === "name" ? 20 : undefined}
        className={`input input-sm input-bordered w-full ${error ? "input-error" : ""}`}
        {...register(key)}
      />
      {error && <span className="text-error text-xs">{error}</span>}
    </>
  );
}
