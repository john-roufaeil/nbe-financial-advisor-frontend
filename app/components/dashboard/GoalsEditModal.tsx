import { forwardRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGoalsStore } from "@/store/use-goals-store";
import { useConfirmStore } from "@/store/use-confirm-store";

export const GoalsEditModal = forwardRef<HTMLDialogElement>(
  function GoalsEditModal(_props, ref) {
    const { t } = useTranslation();
    const { goals, updateGoal, removeGoal, addGoal } = useGoalsStore();
    const confirm = useConfirmStore((s) => s.confirm);
    const [newName, setNewName] = useState("");
    const [newTarget, setNewTarget] = useState("");

    function handleAdd() {
      const target = Number(newTarget);
      if (!newName.trim() || !target || target <= 0) return;
      addGoal({ name: newName.trim(), current: 0, target });
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
            {goals.map((goal) => (
              <li
                key={goal.id}
                className="border-base-300 flex items-end gap-2 rounded-lg border p-3"
              >
                <label className="flex flex-1 flex-col gap-1">
                  <span className="label-text text-xs">{t("dashboard.goals.name")}</span>
                  <input
                    type="text"
                    value={goal.name}
                    onChange={(e) =>
                      updateGoal(goal.id, { ...goal, name: e.target.value })
                    }
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
                    value={goal.current}
                    onChange={(e) =>
                      updateGoal(goal.id, { ...goal, current: Number(e.target.value) })
                    }
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
                    value={goal.target}
                    onChange={(e) =>
                      updateGoal(goal.id, { ...goal, target: Number(e.target.value) })
                    }
                    className="input input-sm input-bordered w-full"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    confirm({
                      title: t("confirm.deleteGoalTitle"),
                      message: t("confirm.deleteMessage"),
                      onConfirm: () => removeGoal(goal.id),
                    })
                  }
                  className="btn btn-ghost btn-sm btn-square text-error"
                  aria-label={t("actions.delete", { name: goal.name })}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
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
