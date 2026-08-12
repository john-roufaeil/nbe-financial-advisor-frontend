import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMonthlySummaries } from "@/queries/analytics";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import { Money } from "@/components/shared/Money";
import { formatMoney } from "@/lib/format";
import { lastPeriods } from "@/lib/budget-period";

const MONTHS_SHOWN = 6;
const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;
const BAR_MAX_WIDTH = 24;
/** Matches the dataviz skill's "4px rounded data-end, square at the baseline" bar spec. */
const CORNER_RADIUS = 4;
const BAR_GAP = 2;

function monthAbbr(period: string, locale: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "short" });
}

interface MonthNet {
  period: string;
  net: number;
}

export function SavingsPerMonthChart() {
  const { t, i18n } = useTranslation();
  const periods = useMemo(() => lastPeriods(MONTHS_SHOWN), []);
  const {
    data: summaries,
    isPending,
    isError,
    refetch,
  } = useMonthlySummaries(periods[0]);
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(
    null,
  );

  const months: MonthNet[] = useMemo(() => {
    const byPeriod = new Map((summaries ?? []).map((s) => [s.month.slice(0, 7), s]));
    return periods.map((period) => {
      const summary = byPeriod.get(period);
      return { period, net: summary ? summary.totalInflow - summary.totalSpend : 0 };
    });
  }, [summaries, periods]);

  const maxPositive = Math.max(0, ...months.map((m) => m.net));
  const maxNegative = Math.max(0, ...months.map((m) => -m.net));
  const totalRange = maxPositive + maxNegative;
  // Baseline splits the chart height proportionally to how much room the
  // positive vs. negative side actually needs, instead of a fixed 50/50 —
  // most months are all-positive, so a fixed midline would waste half the
  // chart on a side nothing ever touches.
  const baselineY =
    totalRange > 0 ? (CHART_HEIGHT * maxPositive) / totalRange : CHART_HEIGHT / 2;
  const usablePositiveHeight = Math.max(1, baselineY - 8);
  const usableNegativeHeight = Math.max(1, CHART_HEIGHT - baselineY - 20);

  const slotWidth = CHART_WIDTH / MONTHS_SHOWN;
  const barWidth = Math.min(BAR_MAX_WIDTH, slotWidth - BAR_GAP * 2);

  const latest = months[months.length - 1];
  const previous = months.length > 1 ? months[months.length - 2] : undefined;
  const delta = previous ? latest.net - previous.net : undefined;
  const avgNet =
    months.length > 0 ? months.reduce((sum, m) => sum + m.net, 0) / months.length : 0;
  const best =
    months.length > 0 ? months.reduce((a, b) => (b.net > a.net ? b : a)) : undefined;
  const DeltaIcon =
    delta === undefined || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="border-base-300 bg-base-100 animate-entry flex h-full flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
          <TrendingUp data-no-flip className="size-4" />
        </span>
        {t("budget.savingsChart.title")}
      </h2>

      {!isPending && !isError && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base-content/50 text-xs">
              {t("budget.savingsChart.latest")}
            </p>
            <Money
              className={`text-2xl font-bold tabular-nums ${latest.net >= 0 ? "text-success" : "text-error"}`}
            >
              {formatMoney(latest.net)}
            </Money>
          </div>
          {delta !== undefined && (
            <span
              className={`badge gap-1 ${delta > 0 ? "badge-success" : delta < 0 ? "badge-error" : "badge-ghost"}`}
            >
              <DeltaIcon data-no-flip className="size-3" />
              <Money className="tabular-nums">{formatMoney(Math.abs(delta))}</Money>
            </span>
          )}
        </div>
      )}

      {isPending ? (
        <CardSkeleton icon={TrendingUp} className="border-none p-0 shadow-none" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 20}`}
          className="w-full"
          role="img"
          aria-label={t("budget.savingsChart.title")}
        >
          {/* Zero baseline — recessive hairline gridline. */}
          <line
            x1={0}
            y1={baselineY}
            x2={CHART_WIDTH}
            y2={baselineY}
            stroke="var(--color-base-300)"
            strokeWidth={1}
          />
          {months.map((m, i) => {
            const isPositive = m.net >= 0;
            const magnitude = Math.abs(m.net);
            const scale = isPositive ? usablePositiveHeight : usableNegativeHeight;
            const maxMagnitude = isPositive ? maxPositive : maxNegative;
            const barHeight =
              maxMagnitude > 0 ? Math.max(2, (magnitude / maxMagnitude) * scale) : 0;
            const x = i * slotWidth + (slotWidth - barWidth) / 2;
            const fill = isPositive ? "var(--color-success)" : "var(--color-error)";
            const isHovered = hovered?.index === i;

            return (
              <g
                key={m.period}
                className="cursor-pointer"
                style={{
                  filter: isHovered ? "brightness(0.9)" : undefined,
                  transition: "filter 150ms",
                }}
                onMouseEnter={(e) => setHovered({ index: i, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setHovered({ index: i, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHovered(null)}
                onFocus={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHovered({ index: i, x: rect.left + rect.width / 2, y: rect.top });
                }}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="img"
                aria-label={`${monthAbbr(m.period, i18n.language)}: ${formatMoney(m.net)}`}
              >
                {/* Larger, invisible hit target — bigger than the painted bar itself. */}
                <rect
                  x={i * slotWidth}
                  y={0}
                  width={slotWidth}
                  height={CHART_HEIGHT}
                  fill="transparent"
                />
                {barHeight > 0 &&
                  (isPositive ? (
                    <>
                      <rect
                        x={x}
                        y={baselineY - barHeight}
                        width={barWidth}
                        height={barHeight}
                        rx={CORNER_RADIUS}
                        fill={fill}
                      />
                      {/* Squares off the baseline-facing end — a rect's rx rounds
                          all 4 corners, so this patches the bottom pair flat. */}
                      <rect
                        x={x}
                        y={baselineY - CORNER_RADIUS}
                        width={barWidth}
                        height={CORNER_RADIUS}
                        fill={fill}
                      />
                    </>
                  ) : (
                    <>
                      <rect
                        x={x}
                        y={baselineY}
                        width={barWidth}
                        height={barHeight}
                        rx={CORNER_RADIUS}
                        fill={fill}
                      />
                      <rect
                        x={x}
                        y={baselineY}
                        width={barWidth}
                        height={CORNER_RADIUS}
                        fill={fill}
                      />
                    </>
                  ))}
                <text
                  x={i * slotWidth + slotWidth / 2}
                  y={CHART_HEIGHT + 14}
                  textAnchor="middle"
                  fill="var(--color-base-content)"
                  fillOpacity={0.5}
                  fontSize={9}
                >
                  {monthAbbr(m.period, i18n.language)}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {!isPending && !isError && best && (
        <div className="border-base-200 flex justify-around border-t pt-3 text-center">
          <div>
            <p className="text-base-content/50 text-xs">
              {t("budget.savingsChart.average")}
            </p>
            <Money className="text-sm font-semibold tabular-nums">
              {formatMoney(avgNet)}
            </Money>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">
              {t("budget.savingsChart.best")}
            </p>
            <p className="text-sm font-semibold">
              {monthAbbr(best.period, i18n.language)}{" "}
              <Money className="tabular-nums">{formatMoney(best.net)}</Money>
            </p>
          </div>
        </div>
      )}

      {hovered &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            className="bg-neutral text-neutral-content pointer-events-none fixed z-9999 rounded-(--radius-field) px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
            style={{
              top: hovered.y - 8,
              left: hovered.x,
              transform: "translate(-50%, -100%)",
            }}
          >
            {monthAbbr(months[hovered.index].period, i18n.language)}{" "}
            <Money>{formatMoney(months[hovered.index].net)}</Money>
          </span>,
          document.body,
        )}
    </div>
  );
}
