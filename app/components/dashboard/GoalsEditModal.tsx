import { forwardRef, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FinancialGoal } from "@/types/goal";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/queries/goals";
import { useConfirmStore } from "@/store/use-confirm-store";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { SliderField } from "@/components/onboarding/SliderField";
import { closeDialog } from "@/lib/close-dialog";
import {
  GOAL_TARGET_MIN as TARGET_MIN,
  GOAL_TARGET_MAX as TARGET_MAX,
  GOAL_TARGET_STEP as TARGET_STEP,
} from "@/lib/constants/limits";
import { NAME_SUGGESTIONS } from "@/lib/constants/options";

type Draft = { name: string; target: number; duration: number };

const EMPTY_DRAFT: Draft = { name: "", target: 0, duration: 0 };
const DURATION_MIN = 1;
const DURATION_MAX = 60;

function toDraft(goal: FinancialGoal): Draft {
  return {
    name: goal.name,
    target: goal.target,
    duration: goal.duration || 0,
  };
}

export const GoalsEditModal = forwardRef<
  HTMLDialogElement,
  { goal?: FinancialGoal; forceEmpty?: boolean }
>(function GoalsEditModal({ goal, forceEmpty }, ref) {
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
    target: z.number().refine((n) => n >= TARGET_MIN && n <= TARGET_MAX, targetInvalid),
    duration: z
      .number()
      .refine((n) => n >= DURATION_MIN && n <= DURATION_MAX, durationInvalid),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<Draft>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: EMPTY_DRAFT,
  });

  // forceEmpty ("Set new savings goal" after completing the current one)
  // blanks the form even though `goal` is still passed in — the record
  // being edited is the same, but the numbers should start fresh, not
  // prefill with the just-completed target.
  useEffect(() => {
    reset(goal && !forceEmpty ? toDraft(goal) : EMPTY_DRAFT);
  }, [goal, forceEmpty, reset]);

  const nameValue = watch("name");

  function closeModal() {
    closeDialog(ref);
  }

  function onSubmit(draft: Draft) {
    const patch = {
      name: draft.name.trim(),
      target: draft.target,
      duration: draft.duration,
      // The API only ever reads name/target/duration off this patch (see
      // goals.ts's upsertGoal) — current is server-computed from actual
      // transaction data and can't be reset by the client, so this value is
      // unused filler to satisfy the shared FinancialGoal-shaped patch type.
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
  const isNew = !goal || forceEmpty;

  return (
    <BaseModal
      ref={ref}
      title={isNew ? t("dashboard.goals.addYours") : t("dashboard.goals.editTitle")}
      actionsStart={
        goal && !forceEmpty ? (
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
      {/* Mirrors onboarding's GoalStep (name + two SliderFields) so setting
          a goal feels the same whether it's the first one during onboarding
          or a later one from the dashboard. */}
      <form
        id="goal-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="label-text text-xs">{t("dashboard.goals.name")}</span>
          <label
            className={`input input-bordered flex w-full items-center gap-2 ${errors.name ? "input-error" : ""}`}
          >
            <input
              type="text"
              placeholder={t("dashboard.goals.newNamePlaceholder")}
              maxLength={20}
              className="min-w-0 grow"
              {...register("name")}
            />
            {nameValue && (
              <button
                type="button"
                onClick={() =>
                  setValue("name", "", { shouldValidate: true, shouldDirty: true })
                }
                aria-label={t("actions.clear")}
                className="btn btn-ghost btn-xs btn-square shrink-0"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
          {errors.name && (
            <span className="text-error text-xs">{errors.name.message}</span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {NAME_SUGGESTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setValue("name", t(`onboarding.goal.suggestions.${key}`), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className="btn btn-outline btn-sm cursor-pointer select-none"
              >
                {t(`onboarding.goal.suggestions.${key}`)}
              </button>
            ))}
          </div>
        </label>

        <Controller
          name="target"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("dashboard.goals.target")}
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={TARGET_MAX}
              step={TARGET_STEP}
              unit={t("currency.EGP")}
              presets={[
                TARGET_MAX / 100,
                TARGET_MAX / 20,
                TARGET_MAX / 10,
                TARGET_MAX / 4,
                TARGET_MAX / 2,
              ].map((amount) => ({ value: amount, label: amount.toLocaleString() }))}
              error={errors.target?.message}
            />
          )}
        />

        <Controller
          name="duration"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("dashboard.goals.duration")}
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={DURATION_MAX}
              step={1}
              unit={t("onboarding.goal.monthsUnit", { count: field.value || 1 })}
              presets={[
                DURATION_MAX / 10,
                DURATION_MAX / 5,
                DURATION_MAX / 2.5,
                DURATION_MAX / 1.25,
              ].map((amount) => ({
                value: Math.round(amount),
                label: amount.toLocaleString(),
              }))}
              error={errors.duration?.message}
            />
          )}
        />
      </form>
    </BaseModal>
  );
});
