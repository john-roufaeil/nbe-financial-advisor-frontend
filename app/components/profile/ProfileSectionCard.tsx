import { useState } from "react";
import { Pencil, Check, X, type User, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useUpdateProfile } from "@/queries/profile";
import { useToastStore } from "@/store/use-toast-store";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import type { User as UserType } from "@/types/profile";

export type Field = {
  key: keyof UserType;
  labelKey: string;
  writable: boolean;
  currency?: boolean;
  ltr?: boolean;
  phone?: boolean;
  placeholderKey?: string;
  options?: { value: string; labelKey: string }[];
};

export type Section = {
  key: string;
  icon: typeof User;
  color: string;
  titleKey: string;
  fields: Field[];
};

// ── Field editing/display ─────────────────────────────────────────────────────

function FieldEditor({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  if (field.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-sm select-bordered w-full"
      >
        <option value="" disabled>
          {t("onboarding.review.empty")}
        </option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    );
  }

  if (field.phone) {
    return (
      <>
        <PhoneInput
          className={`input input-sm input-bordered w-full ${error ? "input-error" : ""}`}
          defaultCountry="EG"
          international
          value={value}
          onChange={(next) => onChange(next ?? "")}
          placeholder={t(field.placeholderKey ?? field.labelKey)}
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(field.placeholderKey ?? field.labelKey)}
        maxLength={field.key === "name" ? 20 : undefined}
        className={`input input-sm input-bordered w-full ${error ? "input-error" : ""}`}
      />
      {error && <span className="text-error text-xs">{error}</span>}
    </>
  );
}

function FieldValue({ field, value }: { field: Field; value?: string }) {
  const { t } = useTranslation();

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
    return (
      <Money className="text-sm font-medium">
        {value} {t("currency.EGP")}
      </Money>
    );
  }

  if (field.ltr) {
    return (
      <span className="text-sm font-medium">
        <bdi dir="ltr">{value.replace(/\s+/g, "")}</bdi>
      </span>
    );
  }

  return <span className="text-sm font-medium">{value}</span>;
}

// ── Section card ──────────────────────────────────────────────────────────────

export function ProfileSectionCard({
  section,
  user,
}: {
  section: Section;
  user: UserType;
}) {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const showToast = useToastStore((s) => s.show);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<UserType>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof UserType, string>>>({});

  const Icon = section.icon;

  function startEdit() {
    const initial: Partial<UserType> = {};
    for (const f of section.fields) {
      if (f.writable) {
        const key = f.key as keyof UserType;
        initial[key] = user[key] ?? "";
      }
    }
    setDraft(initial);
    setErrors({});
    setEditing(true);
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();

    const nextErrors: Partial<Record<keyof UserType, string>> = {};
    const phoneField = section.fields.find((f) => f.phone);
    if (phoneField) {
      const value = (draft[phoneField.key] as string) ?? "";
      if (value && !isValidPhoneNumber(value)) {
        nextErrors[phoneField.key] = t("common.sections.errors.phoneInvalid");
      }
    }

    const nameField = section.fields.find((f) => f.key === "name");
    if (nameField) {
      const value = (draft[nameField.key] as string) ?? "";
      if (!value.trim()) {
        nextErrors[nameField.key] = t("common.sections.errors.nameRequired");
      }
    }

    const incomeField = section.fields.find((f) => f.key === "monthly_income");
    if (incomeField) {
      const value = (draft[incomeField.key] as string) ?? "";
      if (value && Number(value) < 0) {
        nextErrors[incomeField.key] = t("common.sections.errors.incomeNegative");
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateProfile.mutateAsync(draft);
      setEditing(false);
      showToast(t("toast.profileUpdated"), "success");
    } catch {
      /* Error is gracefully surfaced globally via the mutation's onError toast handler */
    }
  }

  function cancel() {
    setDraft({});
    setErrors({});
    setEditing(false);
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
      <form className="card-body gap-4 p-4" onSubmit={save}>
        <div className="flex items-center gap-2">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ${section.color}`}
          >
            <Icon className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">{t(section.titleKey)}</h2>
          {editing ? (
            <div dir="ltr" className="flex gap-1">
              <Tooltip content={t("actions.cancel")}>
                <button
                  type="button"
                  onClick={cancel}
                  className="btn btn-ghost btn-sm btn-square text-error"
                  aria-label={t("actions.cancel")}
                  disabled={updateProfile.isPending}
                >
                  <X className="size-4" />
                </button>
              </Tooltip>
              <Tooltip content={t("actions.done")}>
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm btn-square text-success"
                  aria-label={t("actions.done")}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check data-no-flip className="size-4" />
                  )}
                </button>
              </Tooltip>
            </div>
          ) : (
            <Tooltip content={t("actions.edit")}>
              <button
                type="button"
                onClick={startEdit}
                className="btn btn-ghost btn-sm btn-square"
                aria-label={t("actions.edit")}
              >
                <Pencil data-no-flip className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {section.fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="label-text text-base-content/50 text-xs">
                {t(field.labelKey)}
              </span>
              {editing && field.writable ? (
                <FieldEditor
                  field={field}
                  value={(draft[field.key] as string) ?? ""}
                  error={errors[field.key]}
                  onChange={(value) => {
                    setDraft({ ...draft, [field.key]: value });
                    if (errors[field.key])
                      setErrors({ ...errors, [field.key]: undefined });
                  }}
                />
              ) : (
                <FieldValue field={field} value={user[field.key]} />
              )}
            </label>
          ))}
        </div>
      </form>
    </div>
  );
}
