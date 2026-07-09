import { forwardRef, useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FinancialGoal } from "@/types/goal";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/queries/goals";
import { useConfirmStore } from "@/store/use-confirm-store";

type Draft = { name: string; current: string; target: string };

function toDraft(goal: FinancialGoal): Draft {
  return { name: goal.name, current: String(goal.current), target: String(goal.target) };
}

export const GoalsEditModal = forwardRef<HTMLDialogElement>(
  function GoalsEditModal(_props, ref) {
    const { t } = useTranslation();
    const { data: goals } = useGoals();
    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();
    const confirm = useConfirmStore((s) => s.confirm);
    const [newName, setNewName] = useState("");
    const [newTarget, setNewTarget] = useState("");
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});

    useEffect(() => {
      if (!goals) return;
      setDrafts(Object.fromEntries(goals.map((g) => [g.id, toDraft(g)])));
    }, [goals]);

    function setDraftField(id: string, field: keyof Draft, value: string) {
      setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
    }

    function commitDraft(goal: FinancialGoal) {
      const draft = drafts[goal.id];
      if (!draft) return;
      const patch = {
        name: draft.name.trim() || goal.name,
        current: Number(draft.current) || 0,
        target: Number(draft.target) || goal.target,
      };
      if (
        patch.name !== goal.name ||
        patch.current !== goal.current ||
        patch.target !== goal.target
      ) {
        updateGoal.mutate({ id: goal.id, patch });
      }
    }

    function handleAdd() {
      const target = Number(newTarget);
      if (!newName.trim() || !target || target <= 0) return;
      createGoal.mutate({ name: newName.trim(), current: 0, target });
      setNewName("");
      setNewTarget("");
    }

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

          <ul className="flex flex-col gap-3">
            {(goals ?? []).map((goal) => {
              const draft = drafts[goal.id] ?? toDraft(goal);
              return (
                <li
                  key={goal.id}
                  className="border-base-300 flex items-end gap-2 rounded-lg border p-3"
                >
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="label-text text-xs">
                      {t("dashboard.goals.name")}
                    </span>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraftField(goal.id, "name", e.target.value)}
                      onBlur={() => commitDraft(goal)}
                      className="input input-sm input-bordered w-full"
                    />
                  </label>
                  <label className="flex w-28 flex-col gap-1">
                    <span className="label-text text-xs">
                      {t("dashboard.goals.current")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={draft.current}
                      onChange={(e) => setDraftField(goal.id, "current", e.target.value)}
                      onBlur={() => commitDraft(goal)}
                      className="input input-sm input-bordered w-full"
                    />
                  </label>
                  <label className="flex w-28 flex-col gap-1">
                    <span className="label-text text-xs">
                      {t("dashboard.goals.target")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={draft.target}
                      onChange={(e) => setDraftField(goal.id, "target", e.target.value)}
                      onBlur={() => commitDraft(goal)}
                      className="input input-sm input-bordered w-full"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      confirm({
                        title: t("confirm.deleteGoalTitle"),
                        message: t("confirm.deleteMessage"),
                        onConfirm: () => deleteGoal.mutate(goal.id),
                      })
                    }
                    className="btn btn-ghost btn-sm btn-square text-error"
                    aria-label={t("actions.delete", { name: goal.name })}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-base-300 flex items-end gap-2 rounded-lg border border-dashed p-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="label-text text-xs">{t("dashboard.goals.name")}</span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("dashboard.goals.newNamePlaceholder")}
                className="input input-sm input-bordered w-full"
              />
            </label>
            <label className="flex w-28 flex-col gap-1">
              <span className="label-text text-xs">{t("dashboard.goals.target")}</span>
              <input
                type="number"
                min={0}
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="input input-sm input-bordered w-full"
              />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              className="btn btn-primary btn-sm gap-1"
            >
              <Plus className="size-4" />
              {t("dashboard.goals.add")}
            </button>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn">{t("actions.done")}</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button className="cursor-default">{t("actions.close")}</button>
        </form>
      </dialog>
    );
  },
);
