import { forwardRef, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FinancialGoal } from "@/types/goal";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/queries/goals";
import { useConfirmStore } from "@/store/use-confirm-store";
import { Button } from "@/components/shared/Button";

type Draft = { name: string; current: string; target: string };

const EMPTY_DRAFT: Draft = { name: "", current: "", target: "" };

function toDraft(goal: FinancialGoal): Draft {
  return { name: goal.name, current: String(goal.current), target: String(goal.target) };
}

export const GoalsEditModal = forwardRef<HTMLDialogElement, { goal?: FinancialGoal }>(
  function GoalsEditModal({ goal }, ref) {
    const { t } = useTranslation();
    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();
    const confirm = useConfirmStore((s) => s.confirm);
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

    useEffect(() => {
      setDraft(goal ? toDraft(goal) : EMPTY_DRAFT);
    }, [goal]);

    function setDraftField(field: keyof Draft, value: string) {
      setDraft((d) => ({ ...d, [field]: value }));
    }

    function handleSave() {
      const target = Number(draft.target);
      if (!draft.name.trim() || !target || target <= 0) return;
      const patch = {
        name: draft.name.trim(),
        current: Number(draft.current) || 0,
        target,
      };
      if (goal) {
        updateGoal.mutate({ id: goal.id, patch });
      } else {
        createGoal.mutate(patch);
      }
    }

    const isPending = createGoal.isPending || updateGoal.isPending;

    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box relative flex flex-col gap-4">
          <form method="dialog">
            <button
              className="btn btn-ghost btn-sm btn-circle absolute end-2 top-2"
              aria-label={t("actions.close")}
            >
              <X data-no-flip className="size-4" />
            </button>
          </form>
          <h3 className="text-lg font-semibold">{t("dashboard.goals.editTitle")}</h3>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="label-text text-xs">{t("dashboard.goals.name")}</span>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraftField("name", e.target.value)}
                placeholder={t("dashboard.goals.newNamePlaceholder")}
                className="input input-bordered w-full"
              />
            </label>
            <div className="flex gap-3">
              <label className="flex flex-col gap-1">
                <span className="label-text text-xs">{t("dashboard.goals.current")}</span>
                <input
                  type="number"
                  min={0}
                  value={draft.current}
                  onChange={(e) => setDraftField("current", e.target.value)}
                  className="input input-bordered w-fit"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="label-text text-xs">{t("dashboard.goals.target")}</span>
                <input
                  type="number"
                  min={0}
                  value={draft.target}
                  onChange={(e) => setDraftField("target", e.target.value)}
                  className="input input-bordered w-fit"
                />
              </label>
            </div>
          </div>

          <div className="modal-action items-center justify-between">
            {goal ? (
              <button
                type="button"
                onClick={() =>
                  confirm({
                    title: t("confirm.deleteGoalTitle"),
                    message: t("confirm.deleteMessage"),
                    onConfirm: () => deleteGoal.mutate(goal.id),
                  })
                }
                className="btn btn-ghost btn-sm text-error gap-2"
              >
                <Trash2 className="size-4" />
                {t("actions.delete", { name: goal.name })}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <form method="dialog">
                <button className="btn btn-ghost btn-sm">{t("actions.cancel")}</button>
              </form>
              <Button
                type="button"
                onClick={handleSave}
                loading={isPending}
                className="btn btn-primary btn-sm"
              >
                {t("dashboard.goals.save")}
              </Button>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button className="cursor-default">{t("actions.close")}</button>
        </form>
      </dialog>
    );
  },
);
