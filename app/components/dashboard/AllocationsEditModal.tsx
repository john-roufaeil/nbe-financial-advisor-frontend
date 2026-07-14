import { forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Allocation } from "@/types/budget";
import { useUpdateBudget } from "@/queries/budget";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";
import { moneyFieldBinding } from "@/components/shared/forms/money-field-binding";
import { categoryIcon } from "@/lib/constants/category-icons";
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
    control,
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

  // Drives both the progress bar and the disabled-Save tooltip below — one
  // reason, stated once, instead of the bar and the tooltip drifting out of
  // sync if either were computed separately.
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
      title={t("dashboard.budget.editAllocations")}
      actions={
        <>
          <Tooltip content={blockedReason}>
            <Button
              type="submit"
              form="allocations-form"
              loading={updateBudget.isPending}
              disabled={!isValid}
              className="btn btn-primary btn-sm"
            >
              {t("dashboard.goals.save")}
            </Button>
          </Tooltip>
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
        {/* Always-visible readout of where the split stands, so "why can't I
            save" is answered by looking at the form itself, not just by
            hovering the disabled Save button. */}
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

        <div className="grid grid-cols-2 gap-3">
          {rows.map((row, i) => {
            const Icon = categoryIcon(row.category);
            return (
              <label key={row.category} className="flex flex-col gap-1">
                <span className="label-text flex items-center gap-1.5 text-xs">
                  <Icon data-no-flip className="text-base-content/50 size-3.5" />
                  {t(`dashboard.budget.categoryNames.${row.category}`, row.category)}
                </span>
                <Controller
                  name={`rows.${i}.percentage`}
                  control={control}
                  render={({ field }) => (
                    <MoneyInput
                      {...moneyFieldBinding(field)}
                      max={100}
                      unit="%"
                      aria-label={t(
                        `dashboard.budget.categoryNames.${row.category}`,
                        row.category,
                      )}
                      className={`w-full ${errors.rows?.[i]?.percentage ? "input-error" : ""}`}
                    />
                  )}
                />
                {errors.rows?.[i]?.percentage && (
                  <span className="text-error text-xs">
                    {errors.rows[i]?.percentage?.message}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </form>
    </BaseModal>
  );
});
