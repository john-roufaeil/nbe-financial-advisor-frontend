import {
  AlertTriangle,
  BriefcaseBusiness,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  WifiOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import { formatDateTime } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { useConfirmStore } from "@/store/use-confirm-store";
import {
  useDeleteInvestmentHolding,
  useHoldingValuation,
} from "@/queries/investment-holdings";
import type { HoldingValuationItem, InvestmentHolding } from "@/types/investment-holding";

const STATUS_TONE: Record<HoldingValuationItem["quote_status"], string> = {
  current: "badge-success",
  needs_refresh: "badge-warning",
  unavailable: "badge-error",
  disabled: "badge-neutral",
};

function CalculationTooltip({ content, label }: { content: string; label: string }) {
  return (
    <Tooltip content={content} position="top">
      <button
        type="button"
        aria-label={label}
        className="text-base-content/35 hover:bg-base-300 hover:text-base-content focus-visible:bg-base-300 focus-visible:text-base-content grid size-6 shrink-0 place-items-center rounded-full transition-colors"
      >
        <Info className="size-4" />
      </button>
    </Tooltip>
  );
}

function ReturnValue({ item }: { item: HoldingValuationItem }) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay(true);
  if (item.gain_loss === null || item.gain_loss_percentage === null) {
    return <span className="text-base-content/45">—</span>;
  }
  const positive = item.gain_loss > 0;
  const negative = item.gain_loss < 0;
  const Icon = negative ? TrendingDown : TrendingUp;
  return (
    <span
      className={`flex items-center gap-1 font-semibold tabular-nums ${
        positive ? "text-success" : negative ? "text-error" : "text-base-content"
      }`}
    >
      <Icon className="size-4" />
      <Money>
        {positive ? "+" : ""}
        {formatN(item.gain_loss)} {t("currency.EGP", "EGP")}
      </Money>
      <span className="text-xs font-normal">
        ({positive ? "+" : ""}
        {formatN(item.gain_loss_percentage)}%)
      </span>
    </span>
  );
}

export function InvestmentHoldingsPanel({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (holding: InvestmentHolding) => void;
}) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay(true);
  const timeFormat = useDisplayPreferencesStore((state) => state.timeFormat);
  const dateFormat = useDisplayPreferencesStore((state) => state.dateFormat);
  const confirm = useConfirmStore((state) => state.confirm);
  const valuation = useHoldingValuation();
  const deleteHolding = useDeleteInvestmentHolding();

  function remove(holding: InvestmentHolding) {
    confirm({
      title: t("investmentPlans.holdings.deleteTitle"),
      message: t("investmentPlans.holdings.deleteMessage", {
        instrument: holding.instrument.display_name,
      }),
      confirmLabel: t("investmentPlans.holdings.deleteAction"),
      onConfirm: () => deleteHolding.mutate(holding.id),
    });
  }

  return (
    <section className="border-base-300 bg-base-100 overflow-hidden rounded-xl border shadow-sm">
      <div className="border-base-300 flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg">
            <BriefcaseBusiness className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">{t("investmentPlans.holdings.title")}</h2>
            <p className="text-base-content/55 text-xs">
              {t("investmentPlans.holdings.autoRefresh")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => valuation.refetch()}
            disabled={valuation.isFetching}
            className="btn btn-ghost btn-sm btn-square"
            aria-label={t("investmentPlans.holdings.refresh")}
          >
            <RefreshCw
              className={`size-4 ${valuation.isFetching ? "animate-spin" : ""}`}
            />
          </button>
          <button type="button" onClick={onAdd} className="btn btn-primary btn-sm gap-2">
            <Plus className="size-4" />
            {t("investmentPlans.holdings.add")}
          </button>
        </div>
      </div>

      {valuation.isPending ? (
        <div className="p-4 sm:p-5">
          <CardSkeleton
            icon={BriefcaseBusiness}
            rows={Array.from({ length: 4 }, () => ({ kind: "text" as const }))}
          />
        </div>
      ) : valuation.isError || !valuation.data ? (
        <div className="p-4 sm:p-5">
          <ErrorState onRetry={() => valuation.refetch()} />
        </div>
      ) : valuation.data.holdings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <span className="bg-base-200 text-base-content/45 grid size-12 place-items-center rounded-full">
            <BriefcaseBusiness className="size-6" />
          </span>
          <div>
            <p className="font-medium">{t("investmentPlans.holdings.emptyTitle")}</p>
            <p className="text-base-content/55 mt-1 max-w-md text-sm">
              {t("investmentPlans.holdings.emptyText")}
            </p>
          </div>
          <button type="button" onClick={onAdd} className="btn btn-primary btn-sm gap-2">
            <Plus className="size-4" />
            {t("investmentPlans.holdings.addFirst")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {valuation.data.feature_status === "disabled" && (
            <div className="border-base-300 bg-base-200/50 flex items-start gap-2 rounded-lg border p-3 text-sm">
              <WifiOff className="mt-0.5 size-4 shrink-0" />
              <p>{t("investmentPlans.holdings.pricingDisabled")}</p>
            </div>
          )}
          {!valuation.data.is_complete && valuation.data.feature_status === "enabled" && (
            <div className="border-warning/30 bg-warning/10 flex items-start gap-2 rounded-lg border p-3 text-sm">
              <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
              <p>
                {t("investmentPlans.holdings.partialPrices", {
                  priced: valuation.data.priced_holding_count,
                  total: valuation.data.total_holding_count,
                })}
              </p>
            </div>
          )}

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="bg-base-200/55 relative rounded-lg p-3 pe-10">
              <dt className="text-base-content/55 text-xs">
                <span>{t("investmentPlans.holdings.summary.invested")}</span>
              </dt>
              <div className="absolute end-2.5 top-2.5">
                <CalculationTooltip
                  content={t("investmentPlans.holdings.calculation.cost")}
                  label={t("investmentPlans.holdings.calculation.explain", {
                    name: t("investmentPlans.holdings.summary.invested"),
                  })}
                />
              </div>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                <Money>
                  {formatN(valuation.data.total_cost_basis)} {t("currency.EGP", "EGP")}
                </Money>
              </dd>
            </div>
            <div className="bg-base-200/55 relative rounded-lg p-3 pe-10">
              <dt className="text-base-content/55 text-xs">
                <span>{t("investmentPlans.holdings.summary.currentValue")}</span>
              </dt>
              <div className="absolute end-2.5 top-2.5">
                <CalculationTooltip
                  content={t("investmentPlans.holdings.calculation.value")}
                  label={t("investmentPlans.holdings.calculation.explain", {
                    name: t("investmentPlans.holdings.summary.currentValue"),
                  })}
                />
              </div>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {valuation.data.total_current_value === null ? (
                  "—"
                ) : (
                  <Money>
                    {formatN(valuation.data.total_current_value)}{" "}
                    {t("currency.EGP", "EGP")}
                  </Money>
                )}
              </dd>
            </div>
            <div className="bg-base-200/55 relative rounded-lg p-3 pe-10">
              <dt className="text-base-content/55 text-xs">
                <span>{t("investmentPlans.holdings.summary.return")}</span>
              </dt>
              <div className="absolute end-2.5 top-2.5">
                <CalculationTooltip
                  content={t("investmentPlans.holdings.calculation.return")}
                  label={t("investmentPlans.holdings.calculation.explain", {
                    name: t("investmentPlans.holdings.summary.return"),
                  })}
                />
              </div>
              <dd
                className={`mt-1 text-lg font-semibold tabular-nums ${
                  (valuation.data.total_gain_loss ?? 0) > 0
                    ? "text-success"
                    : (valuation.data.total_gain_loss ?? 0) < 0
                      ? "text-error"
                      : ""
                }`}
              >
                {valuation.data.total_gain_loss === null ||
                valuation.data.total_gain_loss_percentage === null ? (
                  "—"
                ) : (
                  <>
                    <Money>
                      {valuation.data.total_gain_loss > 0 ? "+" : ""}
                      {formatN(valuation.data.total_gain_loss)} {t("currency.EGP", "EGP")}
                    </Money>{" "}
                    <span className="text-xs font-normal">
                      ({valuation.data.total_gain_loss_percentage > 0 ? "+" : ""}
                      {formatN(valuation.data.total_gain_loss_percentage)}%)
                    </span>
                  </>
                )}
              </dd>
            </div>
          </dl>

          <div className="grid gap-3 lg:grid-cols-2">
            {valuation.data.holdings.map((item) => {
              const holding = item.holding;
              const unit = t(
                `chat.tools.investment.unit.${holding.instrument.unit}`,
                holding.instrument.unit,
              );
              return (
                <article
                  key={holding.id}
                  className="border-base-300 flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">
                        {holding.instrument.display_name}
                      </h3>
                      <p className="text-base-content/50 text-xs">
                        {formatN(holding.quantity)} {unit} ·{" "}
                        {t("investmentPlans.holdings.avgPaid")}{" "}
                        {formatN(holding.average_purchase_price)} EGP
                      </p>
                    </div>
                    <span
                      className={`badge badge-sm shrink-0 ${STATUS_TONE[item.quote_status]}`}
                    >
                      {t(`investmentPlans.holdings.quoteStatus.${item.quote_status}`)}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-base-content/50 text-xs">
                        {t("investmentPlans.holdings.currentPrice")}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {item.current_price === null
                          ? "—"
                          : `${formatN(item.current_price)} EGP/${unit}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-base-content/50 text-xs">
                        {t("investmentPlans.holdings.currentValue")}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {item.current_value === null ? (
                          "—"
                        ) : (
                          <Money>{formatN(item.current_value)} EGP</Money>
                        )}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-base-content/50 text-xs">
                        {t("investmentPlans.holdings.unrealizedReturn")}
                      </dt>
                      <dd className="mt-0.5">
                        <ReturnValue item={item} />
                      </dd>
                    </div>
                  </dl>

                  {item.observed_at && (
                    <p className="text-base-content/45 text-[11px] leading-relaxed">
                      {t("investmentPlans.holdings.asOf", {
                        date: formatDateTime(item.observed_at, timeFormat, t, dateFormat),
                      })}
                      {item.source ? ` · ${item.source}` : ""}
                    </p>
                  )}

                  <div className="border-base-300 mt-auto flex justify-end gap-1 border-t pt-2">
                    <button
                      type="button"
                      onClick={() => onEdit(holding)}
                      className="btn btn-ghost btn-sm gap-2"
                    >
                      <Pencil className="size-4" />
                      {t("actions.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(holding)}
                      className="btn btn-ghost btn-sm btn-square text-error"
                      aria-label={t("actions.delete", {
                        name: holding.instrument.display_name,
                      })}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="text-base-content/45 text-[11px]">
            {t("investmentPlans.holdings.lastChecked", {
              date: formatDateTime(
                valuation.data.refreshed_at,
                timeFormat,
                t,
                dateFormat,
              ),
            })}
          </p>
        </div>
      )}
    </section>
  );
}
