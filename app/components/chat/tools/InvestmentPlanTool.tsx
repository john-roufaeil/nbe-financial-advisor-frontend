import { useState } from "react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { BookmarkCheck, Check, Clock3, ShieldCheck, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Money } from "@/components/shared/Money";
import { ToolPayloadError } from "@/components/chat/tools/ToolPayloadError";
import { formatDateTime } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import {
  InvestmentPlanPayloadSchema,
  type InvestmentAllocation,
  type InvestmentPlanPayload,
} from "@/types/investment-scenario";

function round(value: number, places: number): number {
  const scale = 10 ** places;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function incrementPlaces(increment: number): number {
  const [, decimals = ""] = increment.toString().split(".");
  return Math.min(decimals.length, 8);
}

/** Recalculate locally from immutable quote fields. This widget never writes
 * a budget and never submits a trade; saving persists an advisory snapshot. */
function recalculate(
  data: InvestmentPlanPayload,
  percentages: Record<string, number>,
): {
  allocations: InvestmentAllocation[];
  totalAllocated: number;
  totalRemainder: number;
} {
  const allocations = data.allocations.map((allocation) => {
    const percentage = percentages[allocation.instrument_id] ?? allocation.percentage;
    const targetAmount = round((data.confirmed_amount * percentage) / 100, 2);
    const places = incrementPlaces(allocation.minimum_increment);
    const rawSteps = targetAmount / allocation.unit_price / allocation.minimum_increment;
    const steps = Math.max(0, Math.floor(rawSteps + 1e-10));
    const quantity = round(steps * allocation.minimum_increment, places);
    const actualAllocatedAmount = round(quantity * allocation.unit_price, 2);

    return {
      ...allocation,
      percentage,
      target_amount: targetAmount,
      quantity,
      actual_allocated_amount: actualAllocatedAmount,
      unallocated_remainder: round(Math.max(0, targetAmount - actualAllocatedAmount), 2),
    };
  });
  const totalAllocated = round(
    allocations.reduce((sum, allocation) => sum + allocation.actual_allocated_amount, 0),
    2,
  );

  return {
    allocations,
    totalAllocated,
    totalRemainder: round(Math.max(0, data.confirmed_amount - totalAllocated), 2),
  };
}

export const InvestmentPlanTool: ToolCallMessagePartComponent = ({
  result,
  addResult,
}) => {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const parsed = InvestmentPlanPayloadSchema.safeParse(result);
  const data = parsed.success ? parsed.data : undefined;
  const formatN = useNumberDisplay(true);
  const dateFormat = useDisplayPreferencesStore((state) => state.dateFormat);
  const timeFormat = useDisplayPreferencesStore((state) => state.timeFormat);
  const [draft, setDraft] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      (data?.allocations ?? []).map((allocation) => [
        allocation.instrument_id,
        allocation.percentage,
      ]),
    ),
  );

  if (result !== undefined && !parsed.success) return <ToolPayloadError />;
  if (!data) return null;

  const locked = data.saved === true || data.confirmed === true;
  const percentages = locked
    ? Object.fromEntries(
        data.allocations.map((allocation) => [
          allocation.instrument_id,
          allocation.percentage,
        ]),
      )
    : draft;
  const totalPercentage = round(
    data.allocations.reduce(
      (sum, allocation) => sum + (percentages[allocation.instrument_id] ?? 0),
      0,
    ),
    2,
  );
  const scenario = recalculate(data, percentages);
  const currencyLabel = t(`currency.${data.currency}`, data.currency);

  function setPercentage(instrumentId: string, value: number) {
    setDraft((current) => ({
      ...current,
      [instrumentId]: Math.min(100, Math.max(0, value)),
    }));
  }

  function handleSave() {
    const snapshot = { ...data };
    delete snapshot.confirmed;
    addResult({
      ...snapshot,
      allocations: scenario.allocations,
      total_allocated: scenario.totalAllocated,
      total_remainder: scenario.totalRemainder,
      saved: true,
    });
  }

  return (
    <div className="border-base-300 bg-base-100 animate-entry my-2 flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
            <TrendingUp className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("chat.tools.investment.title")}</p>
            <p className="text-base-content/60 text-xs">
              {t("chat.tools.investment.basedOn", {
                amount: formatN(data.confirmed_amount),
                currency: currencyLabel,
              })}
            </p>
          </div>
        </div>
        <span className="badge badge-outline badge-sm shrink-0">
          {t(`chat.tools.investment.mode.${data.allocations[0].mode}`)}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {scenario.allocations.map((allocation) => {
          const percentage = percentages[allocation.instrument_id] ?? 0;
          const unitLabel = t(
            `chat.tools.investment.unit.${allocation.unit}`,
            allocation.unit,
          );
          return (
            <section
              key={allocation.instrument_id}
              className="border-base-300 bg-base-200/40 rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium">{allocation.display_name}</p>
                    {allocation.priority && (
                      <span className="badge badge-primary badge-outline badge-xs">
                        {t("chat.tools.investment.priority", {
                          priority: allocation.priority,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <Money className="text-sm font-semibold tabular-nums">
                  {formatN(allocation.actual_allocated_amount)} {currencyLabel}
                </Money>
              </div>

              <label className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-base-content/60">
                    {t("chat.tools.investment.allocation")}
                  </span>
                  <span className="font-medium tabular-nums">{percentage}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={percentage}
                  disabled={locked}
                  aria-label={t("chat.tools.investment.adjust", {
                    instrument: allocation.display_name,
                  })}
                  onChange={(event) =>
                    setPercentage(allocation.instrument_id, Number(event.target.value))
                  }
                  className="range range-primary range-sm"
                />
              </label>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-base-content/55">
                  {t("chat.tools.investment.quote")}
                </dt>
                <dd className="text-end tabular-nums">
                  <Money>
                    {formatN(allocation.unit_price)} {currencyLabel}/{unitLabel}
                  </Money>
                </dd>
                <dt className="text-base-content/55">
                  {t("chat.tools.investment.quantity")}
                </dt>
                <dd className="text-end tabular-nums">
                  {allocation.quantity} {unitLabel}
                </dd>
                {allocation.unallocated_remainder > 0 && (
                  <>
                    <dt className="text-base-content/55">
                      {t("chat.tools.investment.residual")}
                    </dt>
                    <dd className="text-end tabular-nums">
                      <Money>
                        {formatN(allocation.unallocated_remainder)} {currencyLabel}
                      </Money>
                    </dd>
                  </>
                )}
              </dl>

              <div className="text-base-content/50 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                <span>{allocation.source}</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="size-3" />
                  {t("chat.tools.investment.asOf", {
                    date: formatDateTime(
                      allocation.observed_at,
                      timeFormat,
                      t,
                      dateFormat,
                    ),
                  })}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <div className="bg-base-200/60 grid grid-cols-2 gap-3 rounded-lg p-3 text-xs">
        <div>
          <p className="text-base-content/55">{t("chat.tools.investment.allocated")}</p>
          <Money className="font-semibold">
            {formatN(scenario.totalAllocated)} {currencyLabel}
          </Money>
        </div>
        <div>
          <p className="text-base-content/55">
            {t("chat.tools.investment.cashRemainder")}
          </p>
          <Money className="font-semibold">
            {formatN(scenario.totalRemainder)} {currencyLabel}
          </Money>
        </div>
      </div>

      {totalPercentage !== 100 && !locked && (
        <p className="text-warning text-xs">
          {t("chat.tools.investment.percentageWarning", { total: totalPercentage })}
        </p>
      )}

      <p className="text-base-content/60 flex gap-2 text-xs leading-relaxed">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        <span>{data.disclaimer}</span>
      </p>

      {!locked && (
        <div className="border-info/20 bg-info/5 text-base-content/70 flex gap-2 rounded-lg border p-3 text-xs leading-relaxed">
          <BookmarkCheck className="text-info mt-0.5 size-4 shrink-0" />
          <span>{t("chat.tools.investment.saveExplainer")}</span>
        </div>
      )}

      {locked ? (
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="text-success flex items-center gap-1.5 text-xs font-medium">
            <Check className="size-4" />
            {t("chat.tools.investment.saved")}
          </div>
          <Link
            to={localizedPath(lang!, ROUTE_SEGMENTS.investmentPlans)}
            className="btn btn-ghost btn-xs"
          >
            {t("chat.tools.investment.viewSaved")}
          </Link>
        </div>
      ) : (
        <button
          type="button"
          disabled={totalPercentage !== 100}
          onClick={handleSave}
          className="btn btn-primary btn-sm gap-2 self-end"
        >
          <BookmarkCheck className="size-4" />
          {t("chat.tools.investment.save")}
        </button>
      )}
    </div>
  );
};
