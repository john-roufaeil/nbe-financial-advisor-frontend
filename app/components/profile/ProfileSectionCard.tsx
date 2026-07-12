import { useState } from "react";
import { Pencil, Check, X, type User, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateProfile } from "@/queries/profile";
import { useToastStore } from "@/store/use-toast-store";
import { Tooltip } from "@/components/shared/Tooltip";
import { FieldEditor, type FormFieldConfig } from "@/components/shared/forms/FieldEditor";
import { FieldValue } from "@/components/shared/forms/FieldValue";
import type { UpdateProfileBody, User as UserType } from "@/types/profile";

export type Field = FormFieldConfig<keyof UserType>;

type Draft = Record<string, string>;

export type Section = {
  key: string;
  icon: typeof User;
  color: string;
  titleKey: string;
  fields: Field[];
};

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

  const schema = z.record(z.string(), z.string()).superRefine((draft, ctx) => {
    const phoneField = section.fields.find((f) => f.phone);
    if (phoneField) {
      const value = draft[phoneField.key] ?? "";
      if (value && !isValidPhoneNumber(value)) {
        ctx.addIssue({
          code: "custom",
          path: [phoneField.key],
          message: t("common.sections.errors.phoneInvalid"),
        });
      }
    }

    const nameField = section.fields.find((f) => f.key === "name");
    if (nameField) {
      const value = draft[nameField.key] ?? "";
      if (!value.trim()) {
        ctx.addIssue({
          code: "custom",
          path: [nameField.key],
          message: t("common.sections.errors.nameRequired"),
        });
      }
    }

    const incomeField = section.fields.find((f) => f.key === "monthly_income");
    if (incomeField) {
      const value = draft[incomeField.key] ?? "";
      if (value && Number(value) < 0) {
        ctx.addIssue({
          code: "custom",
          path: [incomeField.key],
          message: t("common.sections.errors.incomeNegative"),
        });
      }
    }
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Draft>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {},
  });

  const Icon = section.icon;

  function startEdit() {
    const initial: Draft = {};
    for (const f of section.fields) {
      if (f.writable) {
        initial[f.key as string] = (user[f.key] as string) ?? "";
      }
    }
    reset(initial);
    setEditing(true);
  }

  async function onSubmit(draft: Draft) {
    try {
      await updateProfile.mutateAsync(draft as UpdateProfileBody);
      setEditing(false);
      showToast(t("toast.profileUpdated"), "success");
    } catch {
      /* Error is gracefully surfaced globally via the mutation's onError toast handler */
    }
  }

  function cancel() {
    reset({});
    setEditing(false);
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry min-w-0 border shadow-sm">
      <form className="card-body gap-4 p-4" onSubmit={handleSubmit(onSubmit)}>
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

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {section.fields.map((field) => (
            <label key={field.key} className="flex min-w-0 flex-col gap-1">
              <span className="label-text text-base-content/50 text-xs">
                {t(field.labelKey)}
              </span>
              {editing && field.writable ? (
                <FieldEditor
                  field={field}
                  control={control}
                  register={register}
                  errors={errors}
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
