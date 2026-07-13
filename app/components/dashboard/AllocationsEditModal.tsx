import { forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Allocation } from "@/types/budget";
import { useUpdateBudget } from "@/queries/budget";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { closeDialog } from "@/lib/close-dialog";

type Draft = { category: string; percentage: string }[];

interface FormValues {
  rows: Draft;
}

/** Guards against float drift (e.g. 33.33 + 33.33 + 33.34 = 100.00000000000001)
 * so a logically-100% split never spuriously fails the totals check. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Biggest allocation first, matching the dashboard's Budget Plan Split card
 * and its pie chart — fixed at load time so rows don't jump around as the
 * user edits percentages. */
function toDraft(allocations: Allocation[]): Draft {
  return [...allocations]
    .sort((a, b) => b.allocated_percentage - a.allocated_percentage)
    .map((a) => ({
      category: a.category,
      percentage: String(a.allocated_percentage),
    }));
}

export const AllocationsEditModal = forwardRef<
  HTMLDialogElement,
  { allocations: Allocation[] }
>(function AllocationsEditModal({ allocations }, ref) {
  const { t } = useTranslation();
  const updateBudget = useUpdateBudget();

  const schema = z
    .object({
      rows: z.array(z.object({ category: z.string(), percentage: z.string() })),
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

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { rows: toDraft(allocations) },
  });

  useEffect(() => {
    reset({ rows: toDraft(allocations) });
  }, [allocations, reset]);

  const rows = watch("rows");
  const total = round2(rows.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0));
  const remaining = round2(100 - total);

  function closeModal() {
    closeDialog(ref);
  }

  function onSubmit(values: FormValues) {
    updateBudget.mutate(
      {
        allocations: values.rows.map((d) => ({
          category: d.category,
          allocated_percentage: Number(d.percentage),
        })),
        changed_via: "dashboard",
      },
      { onSuccess: () => closeModal() },
    );
  }

  return (
    <BaseModal
      ref={ref}
      title={
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{t("dashboard.budget.editAllocations")}</span>
          {remaining !== 0 && (
            <span
              className={`truncate text-xs font-normal ${remaining < 0 ? "text-error" : "text-base-content/50"}`}
            >
              {remaining < 0
                ? t("dashboard.budget.allocationsOverAllocated", {
                    amount: Math.abs(remaining),
                  })
                : t("dashboard.budget.allocationsNeedMore", { amount: remaining })}
            </span>
          )}
        </span>
      }
      actions={
        <>
          <Button
            type="submit"
            form="allocations-form"
            loading={updateBudget.isPending}
            disabled={!isValid}
            className="btn btn-primary btn-sm"
          >
            {t("dashboard.goals.save")}
          </Button>
          <button type="button" onClick={closeModal} className="btn btn-ghost btn-sm">
            {t("actions.cancel")}
          </button>
        </>
      }
    >
      <form
        id="allocations-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {rows.map((row, i) => (
          <label key={row.category} className="flex flex-col gap-1">
            <span className="label-text text-xs">
              {t(`dashboard.budget.categoryNames.${row.category}`, row.category)}
            </span>
            <div className="join">
              <input
                type="number"
                min={0}
                max={100}
                {...register(`rows.${i}.percentage`)}
                className={`input input-bordered join-item w-full ${errors.rows?.[i]?.percentage ? "input-error" : ""}`}
              />
              <span className="join-item bg-base-200 border-base-300 flex items-center border px-3 text-sm">
                %
              </span>
            </div>
            {errors.rows?.[i]?.percentage && (
              <span className="text-error text-xs">
                {errors.rows[i]?.percentage?.message}
              </span>
            )}
          </label>
        ))}
      </form>
    </BaseModal>
  );
});
