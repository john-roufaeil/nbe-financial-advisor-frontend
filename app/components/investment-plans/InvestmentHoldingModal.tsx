import { forwardRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { BriefcaseBusiness } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { closeDialog } from "@/lib/close-dialog";
import {
  useCreateInvestmentHolding,
  useInvestmentInstruments,
  useUpdateInvestmentHolding,
} from "@/queries/investment-holdings";
import type { InvestmentHolding } from "@/types/investment-holding";

interface FormValues {
  instrumentId: string;
  quantity: number;
  averagePrice: number;
  fees: number;
  purchasedAt: string;
}

function localToday(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function defaults(holding?: InvestmentHolding | null): FormValues {
  return {
    instrumentId: holding?.instrument.id ?? "",
    quantity: holding?.quantity ?? 0,
    averagePrice: holding?.average_purchase_price ?? 0,
    fees: holding?.fees ?? 0,
    purchasedAt: holding?.purchased_at ?? "",
  };
}

export const InvestmentHoldingModal = forwardRef<
  HTMLDialogElement,
  {
    holding?: InvestmentHolding | null;
    onClosed?: () => void;
  }
>(function InvestmentHoldingModal({ holding, onClosed }, ref) {
  const { t } = useTranslation();
  const { data: instruments = [], isPending: instrumentsPending } =
    useInvestmentInstruments();
  const createHolding = useCreateInvestmentHolding();
  const updateHolding = useUpdateInvestmentHolding();
  const isEditing = Boolean(holding);
  const schema = useMemo(
    () =>
      z.object({
        instrumentId: z.string().uuid(t("investmentPlans.holdings.form.instrumentError")),
        quantity: z
          .number({ error: t("investmentPlans.holdings.form.quantityError") })
          .positive(t("investmentPlans.holdings.form.quantityError")),
        averagePrice: z
          .number({ error: t("investmentPlans.holdings.form.priceError") })
          .positive(t("investmentPlans.holdings.form.priceError")),
        fees: z
          .number({ error: t("investmentPlans.holdings.form.feesError") })
          .nonnegative(t("investmentPlans.holdings.form.feesError")),
        purchasedAt: z.string(),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: defaults(holding),
  });

  useEffect(() => {
    reset(defaults(holding));
  }, [holding, reset]);

  const selected = instruments.find((item) => item.id === watch("instrumentId"));
  const pending = createHolding.isPending || updateHolding.isPending;

  async function submit(values: FormValues) {
    const common = {
      quantity: values.quantity,
      average_purchase_price: values.averagePrice,
      fees: values.fees,
      purchased_at: values.purchasedAt || null,
    };
    try {
      if (holding) {
        await updateHolding.mutateAsync({ id: holding.id, input: common });
      } else {
        await createHolding.mutateAsync({
          ...common,
          instrument_id: values.instrumentId,
        });
      }
      closeDialog(ref);
    } catch {
      // Shared mutation handling already shows the backend validation message.
    }
  }

  return (
    <BaseModal
      ref={ref}
      onClose={onClosed}
      title={
        isEditing
          ? t("investmentPlans.holdings.form.editTitle")
          : t("investmentPlans.holdings.form.addTitle")
      }
      icon={<BriefcaseBusiness className="text-primary size-5" />}
      actions={
        <>
          <Button
            type="submit"
            form="investment-holding-form"
            loading={pending}
            disabled={!isValid || instrumentsPending}
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
        id="investment-holding-form"
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-4"
      >
        <div className="alert alert-info py-2 text-sm">
          <span>{t("investmentPlans.holdings.form.manualNotice")}</span>
        </div>

        <label className="form-control gap-1">
          <span className="label-text font-medium">
            {t("investmentPlans.holdings.form.instrument")}
          </span>
          <select
            {...register("instrumentId")}
            disabled={isEditing || instrumentsPending}
            className={`select select-bordered w-full ${errors.instrumentId ? "select-error" : ""}`}
          >
            <option value="">
              {t("investmentPlans.holdings.form.chooseInstrument")}
            </option>
            {instruments.map((instrument) => (
              <option key={instrument.id} value={instrument.id}>
                {instrument.display_name}
              </option>
            ))}
          </select>
          {errors.instrumentId && (
            <span className="text-error text-xs">{errors.instrumentId.message}</span>
          )}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.holdings.form.quantity")}
            </span>
            <input
              {...register("quantity", { valueAsNumber: true })}
              type="number"
              min={selected?.minimum_increment ?? 0}
              step={selected?.minimum_increment ?? "any"}
              inputMode="decimal"
              className={`input input-bordered w-full ${errors.quantity ? "input-error" : ""}`}
            />
            <span className="text-base-content/55 text-xs">
              {selected
                ? t("investmentPlans.holdings.form.quantityUnit", {
                    unit: t(`chat.tools.investment.unit.${selected.unit}`, selected.unit),
                  })
                : t("investmentPlans.holdings.form.quantityHint")}
            </span>
            {errors.quantity && (
              <span className="text-error text-xs">{errors.quantity.message}</span>
            )}
          </label>

          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.holdings.form.averagePrice")}
            </span>
            <div className="join w-full">
              <input
                {...register("averagePrice", { valueAsNumber: true })}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                className={`input input-bordered join-item min-w-0 flex-1 ${errors.averagePrice ? "input-error" : ""}`}
              />
              <span className="join-item border-base-300 bg-base-200 grid place-items-center border px-3 text-sm">
                EGP
              </span>
            </div>
            <span className="text-base-content/55 text-xs">
              {t("investmentPlans.holdings.form.averagePriceHint")}
            </span>
            {errors.averagePrice && (
              <span className="text-error text-xs">{errors.averagePrice.message}</span>
            )}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control gap-1">
            <span className="label-text font-medium">
              {t("investmentPlans.holdings.form.fees")}
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
              {t("investmentPlans.holdings.form.purchaseDate")}
            </span>
            <input
              {...register("purchasedAt")}
              type="date"
              max={localToday()}
              className="input input-bordered w-full"
            />
          </label>
        </div>
      </form>
    </BaseModal>
  );
});
