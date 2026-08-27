import { forwardRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { closeDialog } from "@/lib/close-dialog";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useUpdatePlannedAllocation } from "@/queries/investment-scenarios";
import type {
  InvestmentAllocation,
  PlannedAllocationInput,
  SavedInvestmentScenario,
} from "@/types/investment-scenario";

interface FormValues {
  targetAmount: number;
  unitPrice: number;
  quantity: number;
}

export const PlannedAllocationModal = forwardRef<
  HTMLDialogElement,
  {
    scenario?: SavedInvestmentScenario | null;
    allocation?: InvestmentAllocation | null;
  }
>(function PlannedAllocationModal({ scenario, allocation }, ref) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay(true);
  const updateAllocation = useUpdatePlannedAllocation();
  const schema = useMemo(
    () =>
      z
        .object({
          targetAmount: z
            .number({ error: t("investmentPlans.edit.form.amountError") })
            .positive(t("investmentPlans.edit.form.amountError")),
          quantity: z
            .number({ error: t("investmentPlans.edit.form.quantityError") })
            .positive(t("investmentPlans.edit.form.quantityError"))
            .refine(
              (value) => {
                const increment = allocation?.minimum_increment ?? 1;
                return Math.abs(value / increment - Math.round(value / increment)) < 1e-7;
              },
              t("investmentPlans.edit.form.incrementError", {
                increment: allocation?.minimum_increment ?? 1,
              }),
            ),
          unitPrice: z
            .number({ error: t("investmentPlans.edit.form.priceError") })
            .positive(t("investmentPlans.edit.form.priceError")),
        })
        .refine(
          (values) => values.quantity * values.unitPrice <= values.targetAmount + 0.005,
          {
            path: ["quantity"],
            message: t("investmentPlans.edit.form.exceedsAmount"),
          },
        ),
    [allocation?.minimum_increment, t],
  );
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      targetAmount: allocation?.target_amount ?? 0,
      unitPrice: allocation?.unit_price ?? 0,
      quantity: allocation?.quantity ?? 0,
    },
  });

  useEffect(() => {
    reset({
      targetAmount: allocation?.target_amount ?? 0,
      unitPrice: allocation?.unit_price ?? 0,
      quantity: allocation?.quantity ?? 0,
    });
  }, [allocation, reset]);

  if (!scenario || !allocation) return null;

  const unit = t(`chat.tools.investment.unit.${allocation.unit}`, allocation.unit);
  const targetAmount = watch("targetAmount");
  const unitPrice = watch("unitPrice");
  const quantity = watch("quantity");
  const plannedPurchaseValue = Math.max(0, quantity * unitPrice);
  const plannedRemainder = Math.max(0, targetAmount - plannedPurchaseValue);

  async function submit(values: FormValues) {
    if (!scenario || !allocation) return;
    const targetAmountChanged = values.targetAmount !== allocation.target_amount;
    const unitPriceChanged = values.unitPrice !== allocation.unit_price;
    const quantityChanged = values.quantity !== allocation.quantity;
    const input: PlannedAllocationInput = {
      ...(targetAmountChanged ? { target_amount: values.targetAmount } : {}),
      ...(unitPriceChanged ? { unit_price: values.unitPrice } : {}),
      ...((targetAmountChanged || unitPriceChanged || quantityChanged) && {
        quantity: values.quantity,
      }),
    };
    if (Object.keys(input).length === 0) {
      closeDialog(ref);
      return;
    }
    try {
      await updateAllocation.mutateAsync({
        scenarioId: scenario.id,
        instrumentId: allocation.instrument_id,
        input,
      });
      closeDialog(ref);
    } catch {
      // Shared mutation handling already shows the backend validation message.
    }
  }

  return (
    <BaseModal
      ref={ref}
      title={t("investmentPlans.edit.title", {
        investment: allocation.display_name,
      })}
      icon={<Pencil className="text-primary size-5" />}
      actions={
        <>
          <Button
            type="submit"
            form="planned-allocation-form"
            loading={updateAllocation.isPending}
            disabled={!isValid || !isDirty}
            className="btn btn-primary"
          >
            {t("actions.save")}
          </Button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => closeDialog(ref)}
          >
            {t("actions.cancel")}
          </button>
        </>
      }
    >
      <form
        id="planned-allocation-form"
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-4"
      >
        <div className="border-info/25 bg-info/5 rounded-lg border p-3 text-sm">
          {t("investmentPlans.edit.notice")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control gap-1 sm:col-span-2">
            <span className="label-text font-medium">
              {t("investmentPlans.edit.form.amount")}
            </span>
            <div className="join w-full">
              <input
                {...register("targetAmount", { valueAsNumber: true })}
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                className={`input input-bordered join-item min-w-0 flex-1 ${errors.targetAmount ? "input-error" : ""}`}
              />
              <span className="join-item border-base-300 bg-base-200 grid place-items-center border px-3 text-sm">
                EGP
              </span>
            </div>
            {errors.targetAmount && (
              <span className="text-error text-xs">{errors.targetAmount.message}</span>
            )}
          </label>

          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.edit.form.quantity")}
            </span>
            <input
              {...register("quantity", { valueAsNumber: true })}
              type="number"
              min={allocation.minimum_increment}
              step={allocation.minimum_increment}
              inputMode="decimal"
              className={`input input-bordered w-full ${errors.quantity ? "input-error" : ""}`}
            />
            <span className="text-base-content/55 text-xs">{unit}</span>
            {errors.quantity && (
              <span className="text-error text-xs">{errors.quantity.message}</span>
            )}
          </label>

          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.edit.form.price")}
            </span>
            <div className="join w-full">
              <input
                {...register("unitPrice", { valueAsNumber: true })}
                type="number"
                min="0.0001"
                step="0.0001"
                inputMode="decimal"
                className={`input input-bordered join-item min-w-0 flex-1 ${errors.unitPrice ? "input-error" : ""}`}
              />
              <span className="join-item border-base-300 bg-base-200 grid place-items-center border px-3 text-sm">
                EGP
              </span>
            </div>
            {errors.unitPrice && (
              <span className="text-error text-xs">{errors.unitPrice.message}</span>
            )}
          </label>
        </div>

        <div className="border-base-300 bg-base-200/40 rounded-lg border p-3 text-xs">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-base-content/55">
                {t("investmentPlans.edit.purchaseValue")}
              </dt>
              <dd className="mt-1 font-medium tabular-nums">
                {formatN(plannedPurchaseValue)} EGP
              </dd>
            </div>
            <div>
              <dt className="text-base-content/55">
                {t("investmentPlans.edit.remainder")}
              </dt>
              <dd className="mt-1 font-medium tabular-nums">
                {formatN(plannedRemainder)} EGP
              </dd>
            </div>
          </dl>
        </div>
      </form>
    </BaseModal>
  );
});
