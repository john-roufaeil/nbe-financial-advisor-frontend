import { useTranslation } from "react-i18next";
import { Money } from "@/components/shared/Money";
import type { FormFieldConfig } from "@/components/shared/forms/FieldEditor";
import { useNumberDisplay } from "@/lib/use-number-display";

/** Renders the read-only display for a `FormFieldConfig` — the counterpart
 * to `FieldEditor` shown while the field isn't being edited. */
export function FieldValue({ field, value }: { field: FormFieldConfig; value?: string }) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();

  const option = field.options?.find((opt) => opt.value === value);
  if (option) {
    return <span className="text-sm font-medium">{t(option.labelKey)}</span>;
  }

  if (!value) {
    return (
      <span className="text-base-content/30 text-sm font-medium italic">
        {t("onboarding.review.empty")}
      </span>
    );
  }

  if (field.currency) {
    const numeric = Number(value);
    const formatted = Number.isFinite(numeric) ? formatN(numeric) : value;
    return (
      <Money className="text-sm font-medium">
        {formatted} {t("currency.EGP")}
      </Money>
    );
  }

  if (field.ltr) {
    // Stripped of spaces this becomes one long unbreakable token (e.g. a
    // phone number) — break-all lets it wrap mid-string instead of forcing
    // its grid cell (and the whole card) wider than a narrow viewport.
    return (
      <span className="block text-sm font-medium break-all">
        <bdi dir="ltr">{value.replace(/\s+/g, "")}</bdi>
      </span>
    );
  }

  return <span className="text-sm font-medium wrap-break-word">{value}</span>;
}
