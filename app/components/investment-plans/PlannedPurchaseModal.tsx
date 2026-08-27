import { forwardRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { ShoppingBag } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { Money } from "@/components/shared/Money";
import { closeDialog } from "@/lib/close-dialog";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useRecordPlannedPurchase } from "@/queries/investment-scenarios";
import type { InvestmentHolding } from "@/types/investment-holding";
import type {
  InvestmentAllocation,
  SavedInvestmentScenario,
} from "@/types/investment-scenario";

interface FormValues {
  quantity: number;
  unitPrice: number;
  fees: number;
  purchasedAt: string;
}

function localToday(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function defaults(allocation?: InvestmentAllocation | null): FormValues {
  return {
    quantity: allocation?.quantity ?? 0,
    unitPrice: allocation?.unit_price ?? 0,
    fees: 0,
    purchasedAt: localToday(),
  };
}

export const PlannedPurchaseModal = forwardRef<
  HTMLDialogElement,
  {
    scenario?: SavedInvestmentScenario | null;
    allocation?: InvestmentAllocation | null;
    existingHolding?: InvestmentHolding | null;
    onClosed?: () => void;
  }
>(function PlannedPurchaseModal(
  { scenario, allocation, existingHolding, onClosed },
  ref,
) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay(true);
  const recordPurchase = useRecordPlannedPurchase();
  const schema = useMemo(
    () =>
      z.object({
        quantity: z
          .number({ error: t("investmentPlans.purchase.form.quantityError") })
          .positive(t("investmentPlans.purchase.form.quantityError")),
        unitPrice: z
          .number({ error: t("investmentPlans.purchase.form.priceError") })
          .positive(t("investmentPlans.purchase.form.priceError")),
        fees: z
          .number({ error: t("investmentPlans.purchase.form.feesError") })
          .nonnegative(t("investmentPlans.purchase.form.feesError")),
        purchasedAt: z.string().min(1, t("investmentPlans.purchase.form.dateError")),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: defaults(allocation),
  });

  useEffect(() => {
    reset(defaults(allocation));
  }, [allocation, reset]);

  if (!scenario || !allocation) return null;

  const unit = t(`chat.tools.investment.unit.${allocation.unit}`, allocation.unit);

  async function submit(values: FormValues) {
    if (!scenario || !allocation) return;
    try {
      await recordPurchase.mutateAsync({
        scenarioId: scenario.id,
        instrumentId: allocation.instrument_id,
        input: {
          quantity: values.quantity,
          unit_price: values.unitPrice,
          fees: values.fees,
          purchased_at: values.purchasedAt,
        },
      });
      closeDialog(ref);
    } catch {
      // Shared mutation handling already shows the backend validation message.
    }
  }

  return (
    <BaseModal
      ref={ref}
      onClose={onClosed}
      title={t("investmentPlans.purchase.title", {
        investment: allocation.display_name,
      })}
      icon={<ShoppingBag className="text-primary size-5" />}
      actions={
        <>
          <Button
            type="submit"
            form="planned-purchase-form"
            loading={recordPurchase.isPending}
            disabled={!isValid}
            className="btn btn-primary"
          >
            {t("investmentPlans.purchase.confirm")}
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
        id="planned-purchase-form"
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-4"
      >
        <div className="border-info/25 bg-info/5 rounded-lg border p-3 text-sm">
          <p>{t("investmentPlans.purchase.notice")}</p>
          {existingHolding && (
            <p className="text-base-content/65 mt-1 text-xs">
              {t("investmentPlans.purchase.mergeNotice")}
            </p>
          )}
        </div>

        <div className="border-base-300 bg-base-200/40 rounded-lg border p-3">
          <p className="text-base-content/55 text-xs">
            {t("investmentPlans.purchase.planEstimate")}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>
              {formatN(allocation.quantity)} {unit}
            </span>
            <Money className="font-medium tabular-nums">
              {formatN(allocation.unit_price)} EGP/{unit}
            </Money>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.purchase.form.quantity")}
            </span>
            <input
              {...register("quantity", { valueAsNumber: true })}
              type="number"
              min={allocation.minimum_increment}
              step={allocation.minimum_increment}
              inputMode="decimal"
              className={`input input-bordered w-full ${errors.quantity ? "input-error" : ""}`}
            />
            <span className="text-base-content/55 text-xs">
              {t("investmentPlans.purchase.form.quantityUnit", { unit })}
            </span>
            {errors.quantity && (
              <span className="text-error text-xs">{errors.quantity.message}</span>
            )}
          </label>

          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.purchase.form.price")}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.purchase.form.fees")}
            </span>
            <input
              {...register("fees", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={`input input-bordered w-full ${errors.fees ? "input-error" : ""}`}
            />
            {errors.fees && (
              <span className="text-error text-xs">{errors.fees.message}</span>
            )}
          </label>

          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.purchase.form.date")}
            </span>
            <input
              {...register("purchasedAt")}
              type="date"
              max={localToday()}
              className={`input input-bordered w-full ${errors.purchasedAt ? "input-error" : ""}`}
            />
            {errors.purchasedAt && (
              <span className="text-error text-xs">{errors.purchasedAt.message}</span>
            )}
          </label>
        </div>
      </form>
    </BaseModal>
  );
});
