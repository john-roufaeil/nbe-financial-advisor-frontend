import { forwardRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FinancialGoal } from "@/types/goal";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/queries/goals";
import { useConfirmStore } from "@/store/use-confirm-store";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import {
  GOAL_TARGET_MIN as TARGET_MIN,
  GOAL_TARGET_MAX as TARGET_MAX,
} from "@/lib/constants/limits";

type Draft = { name: string; target: string; duration: string };

const EMPTY_DRAFT: Draft = { name: "", target: "", duration: "" };
const DURATION_MIN = 1;
const DURATION_MAX = 60;

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

    const targetInvalid = t("dashboard.goals.errors.targetInvalid", {
      min: TARGET_MIN.toLocaleString(),
      max: TARGET_MAX.toLocaleString(),
    });
    const durationInvalid = t("dashboard.goals.errors.durationInvalid", {
      min: DURATION_MIN,
      max: DURATION_MAX,
    });

    const schema = z.object({
      name: z
        .string()
        .trim()
        .min(1, t("dashboard.goals.errors.nameRequired"))
        .max(20, t("dashboard.goals.errors.nameTooLong")),
      target: z.string().refine((v) => {
        const n = Number(v);
        return v !== "" && Number.isFinite(n) && n >= TARGET_MIN && n <= TARGET_MAX;
      }, targetInvalid),
      duration: z.string().refine((v) => {
        const n = Number(v);
        return v !== "" && Number.isFinite(n) && n >= DURATION_MIN && n <= DURATION_MAX;
      }, durationInvalid),
    });

    const {
      control,
      register,
      handleSubmit,
      reset,
      formState: { errors, isValid },
    } = useForm<Draft>({
      resolver: zodResolver(schema),
      mode: "onChange",
      defaultValues: EMPTY_DRAFT,
    });

    useEffect(() => {
      reset(goal ? toDraft(goal) : EMPTY_DRAFT);
    }, [goal, reset]);

    function closeModal() {
      if (ref && "current" in ref && ref.current) {
        ref.current.close();
      }
    }

    function onSubmit(draft: Draft) {
      const patch = {
        name: draft.name.trim(),
        target: Number(draft.target),
        duration: Number(draft.duration),
        current: goal?.current ?? 0,
      };

      const options = {
        onSuccess: () => closeModal(),
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
              type="submit"
              form="goal-form"
              loading={isPending}
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
          id="goal-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="label-text text-xs">{t("dashboard.goals.name")}</span>
            <input
              type="text"
              placeholder={t("dashboard.goals.newNamePlaceholder")}
              maxLength={20}
              className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
              {...register("name")}
            />
            {errors.name && (
              <span className="text-error text-xs">{errors.name.message}</span>
            )}
          </label>

          <div className="grid w-full grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="label-text text-xs">{t("dashboard.goals.target")}</span>
              <Controller
                name="target"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-valuemin={TARGET_MIN}
                    aria-valuemax={TARGET_MAX}
                    value={field.value === "" ? "" : Number(field.value).toLocaleString()}
                    onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="0"
                    className={`input input-bordered w-full ${errors.target ? "input-error" : ""}`}
                  />
                )}
              />
              {errors.target && (
                <span className="text-error text-xs">{errors.target.message}</span>
              )}
            </label>

            <label className="flex min-w-0 flex-col gap-1">
              <span className="label-text text-xs">{t("dashboard.goals.duration")}</span>
              <input
                type="number"
                min={DURATION_MIN}
                max={DURATION_MAX}
                placeholder={t("dashboard.goals.monthsPlaceholder", "Months")}
                className={`input input-bordered w-full ${errors.duration ? "input-error" : ""}`}
                {...register("duration")}
              />
              {errors.duration && (
                <span className="text-error text-xs">{errors.duration.message}</span>
              )}
            </label>
          </div>
        </form>
      </BaseModal>
    );
  },
);
