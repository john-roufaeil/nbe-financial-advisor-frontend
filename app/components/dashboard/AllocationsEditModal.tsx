import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Allocation } from "@/types/budget";
import { useUpdateBudget } from "@/queries/budget";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/BaseModal";

type Draft = { category: string; percentage: string }[];

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
  const [draft, setDraft] = useState<Draft>(() => toDraft(allocations));
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    setDraft(toDraft(allocations));
    setErrors({});
  }, [allocations]);

  const total = draft.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0);
  const isRowInRange = (d: Draft[number]) => {
    const n = Number(d.percentage);
    return Number.isFinite(n) && n >= 0 && n <= 100;
  };
  const isValid = total === 100 && draft.every(isRowInRange);
  const remaining = 100 - total;

  function setPercentage(index: number, value: string) {
    setDraft((d) =>
      d.map((row, i) => (i === index ? { ...row, percentage: value } : row)),
    );
    setErrors((e) => ({ ...e, [index]: undefined as unknown as string }));
  }

  function handleBlur(index: number) {
    const n = Number(draft[index].percentage);
    setErrors((e) => ({
      ...e,
      [index]:
        Number.isFinite(n) && n >= 0 && n <= 100
          ? (undefined as unknown as string)
          : t("dashboard.budget.errors.percentageRange"),
    }));
  }

  function closeModal() {
    if (ref && "current" in ref && ref.current) {
      ref.current.close();
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      const nextErrors: Record<number, string> = {};
      draft.forEach((d, i) => {
        if (!isRowInRange(d))
          nextErrors[i] = t("dashboard.budget.errors.percentageRange");
      });
      setErrors(nextErrors);
      return;
    }

    updateBudget.mutate(
      {
        allocations: draft.map((d) => ({
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
      <form id="allocations-form" onSubmit={handleSave} className="flex flex-col gap-4">
        {draft.map((row, i) => (
          <label key={row.category} className="flex flex-col gap-1">
            <span className="label-text text-xs">
              {t(`dashboard.budget.categoryNames.${row.category}`, row.category)}
            </span>
            <div className="join">
              <input
                type="number"
                min={0}
                max={100}
                value={row.percentage}
                onChange={(e) => setPercentage(i, e.target.value)}
                onBlur={() => handleBlur(i)}
                className={`input input-bordered join-item w-full ${errors[i] ? "input-error" : ""}`}
              />
              <span className="join-item bg-base-200 border-base-300 flex items-center border px-3 text-sm">
                %
              </span>
            </div>
            {errors[i] && <span className="text-error text-xs">{errors[i]}</span>}
          </label>
        ))}
      </form>
    </BaseModal>
  );
});
