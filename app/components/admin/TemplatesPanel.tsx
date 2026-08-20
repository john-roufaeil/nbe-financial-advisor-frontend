import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";
import { moneyFieldBinding } from "@/components/shared/forms/money-field-binding";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { useCategoriesForType } from "@/queries/categories";
import { useConfirmStore } from "@/store/use-confirm-store";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import { closeDialog } from "@/lib/close-dialog";
import {
  useAdminTemplates,
  useCreateAdminTemplate,
  useUpdateAdminTemplate,
  useDeleteAdminTemplate,
} from "@/queries/admin";
import type { AdminTemplate, AdminTemplateCreateBody } from "@/types/admin";

/** Guards against float drift (e.g. 33.33 + 33.33 + 33.34 = 100.00000000000001)
 * so a logically-100% split never spuriously fails the totals check. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Only super_admin can write; the backend answers 403 for reviewers. Unlike
 * the other admin tabs, GET /admin/onboarding-templates isn't paginated —
 * there are only ever a handful of starter templates — so there's no
 * AdminPanelShell pager here. */
export function TemplatesPanel({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const query = useAdminTemplates();
  const deleteMutation = useDeleteAdminTemplate();
  const confirm = useConfirmStore((s) => s.confirm);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<AdminTemplate | null>(null);

  function openCreate() {
    setEditing(null);
    dialogRef.current?.showModal();
  }

  function openEdit(template: AdminTemplate) {
    setEditing(template);
    dialogRef.current?.showModal();
  }

  function askDelete(template: AdminTemplate) {
    confirm({
      title: t("admin.templates.deleteTitle", { name: template.name }),
      message: t("admin.templates.deleteMessage"),
      onConfirm: () => deleteMutation.mutate(template.template_key),
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {canWrite && (
          <div className="flex justify-end">
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("admin.templates.add")}
            </button>
          </div>
        )}

        {query.isLoading ? (
          <ListSkeleton rows={3} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !query.data?.length ? (
          <EmptyState label={t("admin.templates.empty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {query.data.map((template) => (
              <li
                key={template.template_key}
                className="border-base-300 bg-base-100 flex flex-col gap-2 rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">{template.name}</span>
                    <span className="text-base-content/60 font-mono text-xs">
                      {template.template_key}
                    </span>
                  </div>
                  {canWrite && (
                    <div className="flex shrink-0 gap-1">
                      <Tooltip content={t("actions.edit")}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle"
                          onClick={() => openEdit(template)}
                          aria-label={t("actions.edit")}
                        >
                          <Pencil data-no-flip className="size-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t("actions.delete", { name: template.name })}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          onClick={() => askDelete(template)}
                          aria-label={t("actions.delete", { name: template.name })}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
                {template.description && (
                  <p className="text-base-content/70 text-sm">{template.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {template.allocations.map((a) => (
                    <span key={a.category} className="badge badge-ghost badge-sm gap-1">
                      <CategoryLabel category={a.category} type="expense" />
                      <span className="font-semibold">{a.allocated_percentage}%</span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <TemplateFormModal ref={dialogRef} editing={editing} />
    </>
  );
}

interface TemplateFormValues {
  template_key: string;
  name: string;
  description: string;
  rows: { category: string; percentage: string }[];
}

function TemplateFormModal({
  ref,
  editing,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  editing: AdminTemplate | null;
}) {
  const { t } = useTranslation();
  const createMutation = useCreateAdminTemplate();
  const updateMutation = useUpdateAdminTemplate();
  const pending = createMutation.isPending || updateMutation.isPending;
  const expenseCategories = useCategoriesForType("expense");

  const schema = z
    .object({
      template_key: z
        .string()
        .min(1)
        .regex(/^[-a-zA-Z0-9_]+$/, t("admin.templates.errors.keyFormat")),
      name: z.string().min(1),
      description: z.string(),
      rows: z
        .array(z.object({ category: z.string().min(1), percentage: z.string() }))
        .min(1),
    })
    .superRefine((values, ctx) => {
      let total = 0;
      values.rows.forEach((row, i) => {
        const n = Number(row.percentage);
        if (!Number.isFinite(n) || n < 0 || n > 100) {
          ctx.addIssue({
            code: "custom",
            path: ["rows", i, "percentage"],
            message: t("dashboard.budget.errors.percentageRange"),
          });
        } else {
          total += n;
        }
      });
      if (round2(total) !== 100) {
        ctx.addIssue({ code: "custom", path: [], message: "total" });
      }
    });

  function toDraft(template: AdminTemplate | null): TemplateFormValues {
    if (!template) {
      return {
        template_key: "",
        name: "",
        description: "",
        rows: [{ category: "", percentage: "" }],
      };
    }
    return {
      template_key: template.template_key,
      name: template.name,
      description: template.description,
      rows: template.allocations.map((a) => ({
        category: a.category,
        percentage: String(a.allocated_percentage),
      })),
    };
  }

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: toDraft(editing),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rows" });

  // Re-seeds only when the modal's target changes (create ⇄ edit, or a
  // different row) — the dialog element persists across opens, same
  // convention as AllocationsEditModal/CategoryFormModal.
  useEffect(() => {
    reset(toDraft(editing));
  }, [editing, reset]);

  const rows = watch("rows");
  const total = round2(rows.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0));
  const remaining = round2(100 - total);
  const usedCategories = new Set(rows.map((r) => r.category).filter(Boolean));

  function closeModal() {
    closeDialog(ref);
  }

  async function onSubmit(values: TemplateFormValues) {
    const allocations = values.rows.map((d) => ({
      category: d.category,
      allocated_percentage: Number(d.percentage),
    }));
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          templateKey: editing.template_key,
          body: { name: values.name, description: values.description, allocations },
        });
      } else {
        const body: AdminTemplateCreateBody = {
          template_key: values.template_key,
          name: values.name,
          description: values.description,
          allocations,
        };
        await createMutation.mutateAsync(body);
      }
      closeModal();
    } catch {
      // Toast already shown; keep the modal open so input isn't lost.
    }
  }

  const blockedReason =
    remaining > 0
      ? t("dashboard.budget.allocationsNeedMore", { amount: remaining })
      : remaining < 0
        ? t("dashboard.budget.allocationsOverAllocated", { amount: Math.abs(remaining) })
        : !isValid
          ? t("dashboard.budget.errors.fixInvalidPercentages")
          : "";

  return (
    <BaseModal
      ref={ref}
      title={editing ? t("admin.templates.editTitle") : t("admin.templates.addTitle")}
      actions={
        <>
          <Tooltip content={blockedReason}>
            <Button
              type="submit"
              form="admin-template-form"
              className="btn btn-primary"
              loading={pending}
              disabled={!isValid}
            >
              {t("actions.submit")}
            </Button>
          </Tooltip>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>
            {t("actions.cancel")}
          </button>
        </>
      }
    >
      <form
        id="admin-template-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.templates.columns.key")}</span>
          <input
            type="text"
            required
            disabled={!!editing}
            placeholder="e.g. aggressive_savings"
            className="input input-bordered w-full font-mono"
            {...register("template_key")}
          />
          <span className="text-base-content/50 text-xs">
            {t("admin.templates.keyHint")}
          </span>
          {errors.template_key && (
            <span className="text-error text-xs">{errors.template_key.message}</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.templates.columns.name")}</span>
          <input
            type="text"
            required
            className="input input-bordered w-full"
            {...register("name")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.templates.columns.description")}</span>
          <textarea
            rows={2}
            className="textarea textarea-bordered w-full"
            {...register("description")}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-base-content/70">
              {t("dashboard.budget.allocatedOfTotal", { total: Math.min(total, 100) })}
            </span>
            <span
              className={`font-semibold ${
                remaining === 0
                  ? "text-success"
                  : remaining < 0
                    ? "text-error"
                    : "text-warning"
              }`}
            >
              {remaining === 0
                ? t("dashboard.budget.allocationsFullyAllocated")
                : remaining < 0
                  ? t("dashboard.budget.allocationsOverAllocated", {
                      amount: Math.abs(remaining),
                    })
                  : t("dashboard.budget.allocationsNeedMore", { amount: remaining })}
            </span>
          </div>
          <div className="bg-base-300 h-2 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all ${
                remaining === 0 ? "bg-success" : remaining < 0 ? "bg-error" : "bg-warning"
              }`}
              style={{ width: `${Math.min(100, total)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {fields.map((field, i) => {
            const currentCategory = rows[i]?.category;
            return (
              <div key={field.id} className="flex items-center gap-2">
                <select
                  className="select select-bordered select-sm min-w-0 flex-1"
                  {...register(`rows.${i}.category`)}
                >
                  <option value="">{t("admin.templates.selectCategory")}</option>
                  {expenseCategories
                    .filter(
                      (c) => c.name === currentCategory || !usedCategories.has(c.name),
                    )
                    .map((c) => (
                      <option key={c.name} value={c.name}>
                        {t(`common.categories.${c.name}`, c.name)}
                      </option>
                    ))}
                </select>
                <Controller
                  name={`rows.${i}.percentage`}
                  control={control}
                  render={({ field: percentField }) => (
                    <MoneyInput
                      {...moneyFieldBinding(percentField)}
                      max={100}
                      unit="%"
                      hideSteppers
                      aria-label={t("admin.templates.columns.percentage")}
                      className={`w-28 shrink-0 ${
                        errors.rows?.[i]?.percentage ? "input-error" : ""
                      }`}
                    />
                  )}
                />
                <Tooltip content={t("admin.templates.removeRow")}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-circle shrink-0"
                    disabled={fields.length <= 1}
                    onClick={() => remove(i)}
                    aria-label={t("admin.templates.removeRow")}
                  >
                    <X data-no-flip className="size-4" />
                  </button>
                </Tooltip>
              </div>
            );
          })}
          <button
            type="button"
            className="btn btn-ghost btn-sm self-start"
            disabled={fields.length >= expenseCategories.length}
            onClick={() => append({ category: "", percentage: "" })}
          >
            <Plus className="size-4" />
            {t("admin.templates.addRow")}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
