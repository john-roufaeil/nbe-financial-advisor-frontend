import { forwardRef, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FinancialGoal } from "@/types/goal";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/queries/goals";
import { useConfirmStore } from "@/store/use-confirm-store";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/BaseModal";

type Draft = { name: string; target: string; duration: string };

const EMPTY_DRAFT: Draft = { name: "", target: "", duration: "" };

function toDraft(goal: FinancialGoal): Draft {
  return {
    name: goal.name,
    target: String(goal.target),
    duration: String(goal.duration || ""),
  };
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

    // Programmatically dismisses the native dialog container reference elements safely
    function closeModal() {
      if (ref && "current" in ref && ref.current) {
        ref.current.close();
      }
    }

    function handleSave() {
      const target = Number(draft.target);
      const duration = Number(draft.duration);

      if (!draft.name.trim() || !target || target <= 0 || !duration || duration <= 0)
        return;

      const patch = {
        name: draft.name.trim(),
        target,
        duration,
        current: goal?.current ?? 0,
      };

      const options = {
        onSuccess: () => closeModal(), // Closes the modal immediately when mutation finishes successfully
      };

      if (goal) {
        updateGoal.mutate({ id: goal.id, patch }, options);
      } else {
        createGoal.mutate(patch, options);
      }
    }

    const isPending = createGoal.isPending || updateGoal.isPending;

    return (
      <BaseModal
        ref={ref}
        title={goal ? t("dashboard.goals.editTitle") : t("dashboard.goals.addYours")}
        actionsStart={
          goal ? (
            <button
              type="button"
              onClick={() =>
                confirm({
                  title: t("confirm.deleteGoalTitle"),
                  message: t("confirm.deleteMessage"),
                  onConfirm: () => {
                    deleteGoal.mutate(goal.id, { onSuccess: () => closeModal() });
                  },
                })
              }
              className="btn btn-ghost btn-sm text-error gap-2"
            >
              <Trash2 className="size-4" />
              {t("actions.delete", { name: t("dashboard.goals.goal") })}
            </button>
          ) : undefined
        }
        actions={
          <>
            <Button
              type="button"
              onClick={handleSave}
              loading={isPending}
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
        <div className="flex flex-col gap-4">
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

          <div className="grid w-full grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="label-text text-xs">{t("dashboard.goals.target")}</span>
              <input
                type="number"
                min={1}
                value={draft.target}
                onChange={(e) => setDraftField("target", e.target.value)}
                placeholder="0"
                className="input input-bordered w-full"
              />
            </label>

            <label className="flex min-w-0 flex-col gap-1">
              <span className="label-text text-xs">{t("dashboard.goals.duration")}</span>
              <input
                type="number"
                min={1}
                value={draft.duration}
                onChange={(e) => setDraftField("duration", e.target.value)}
                placeholder={t("dashboard.goals.monthsPlaceholder", "Months")}
                className="input input-bordered w-full"
              />
            </label>
          </div>
        </div>
      </BaseModal>
    );
  },
);
