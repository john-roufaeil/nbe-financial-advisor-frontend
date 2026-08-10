import { useId, useState, useRef, useEffect } from "react";
import { z } from "zod";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { PiggyBank } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Money } from "@/components/shared/Money";
import { HighlightStatCard } from "@/components/chat/tools/HighlightStatCard";
import { ToolPayloadError } from "@/components/chat/tools/ToolPayloadError";
import { useNumberDisplay } from "@/lib/use-number-display";

/** Validated at runtime, not just asserted: `result` is LLM-originated, a
 * meaningfully less trustworthy source than a typed REST response. */
const SavingsSliderResultSchema = z.object({
  currency: z.string(),
  currentBalance: z.number(),
  defaultMonthlySavings: z.number(),
});

const HORIZON_MONTHS = 12;
const MAX_MONTHLY = 10000;

function ProjectionChart({
  start,
  monthly,
  currencyLabel,
}: {
  start: number;
  monthly: number;
  currencyLabel: string;
}) {
  const gradientId = useId();
  const formatN = useNumberDisplay();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(280); // Fallback/Initial width
  const height = 90;
  const padY = 12;

  // Track actual container width to prevent SVG non-uniform scaling distortion
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: entryWidth } = entries[0].contentRect;
      if (entryWidth > 0) {
        setWidth(entryWidth);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const points = Array.from(
    { length: HORIZON_MONTHS + 1 },
    (_, i) => start + monthly * i,
  );
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const coords = points.map((v, i) => ({
    x: (i / HORIZON_MONTHS) * width,
    y: height - padY - ((v - min) / range) * (height - padY * 2),
  }));

  const linePath = coords
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const last = coords[coords.length - 1];
  const first = coords[0];

  return (
    <div ref={containerRef} className="bg-base-200/60 w-full rounded-lg p-3">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className="transition-all duration-300 ease-out"
        />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300 ease-out"
        />
        <circle
          cx={first.x}
          cy={first.y}
          r={3.5}
          fill="var(--color-base-100)"
          stroke="var(--color-primary)"
          strokeWidth={2}
        />
        <circle cx={last.x} cy={last.y} r={4} fill="var(--color-primary)" />
      </svg>
      <div className="text-base-content/50 mt-1.5 flex items-center justify-between text-xs">
        <Money>
          {formatN(start)} {currencyLabel}
        </Money>
        <Money className="text-primary font-medium">
          {formatN(points[points.length - 1])} {currencyLabel}
        </Money>
      </div>
    </div>
  );
}

export const SavingsSliderTool: ToolCallMessagePartComponent = ({ result }) => {
  const { t } = useTranslation();
  const parsed = SavingsSliderResultSchema.safeParse(result);
  const data = parsed.success ? parsed.data : undefined;
  const [monthly, setMonthly] = useState(data?.defaultMonthlySavings ?? 0);
  const formatN = useNumberDisplay();

  // undefined result: still streaming in, render nothing yet. Present but
  // malformed: a genuine payload/shape mismatch worth surfacing.
  if (result !== undefined && !parsed.success) return <ToolPayloadError />;
  if (!data) return null;

  const projected = data.currentBalance + monthly * HORIZON_MONTHS;
  const currencyLabel = t(`currency.${data.currency}`, data.currency);

  return (
    <div className="border-base-300 bg-base-100 animate-entry my-2 flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
          <PiggyBank className="size-4" />
        </span>
        <p className="text-sm font-semibold">{t("chat.tools.savings.title")}</p>
      </div>

      <ProjectionChart
        start={data.currentBalance}
        monthly={monthly}
        currencyLabel={currencyLabel}
      />

      <HighlightStatCard
        icon={PiggyBank}
        colorClass="bg-primary text-primary-content"
        label={t("chat.tools.savings.projected", { months: HORIZON_MONTHS })}
        value={
          <Money>
            {formatN(projected)} {currencyLabel}
          </Money>
        }
      />

      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-base-content/60">{t("chat.tools.savings.monthly")}</span>
          <Money className="font-medium tabular-nums">
            {formatN(monthly)} {currencyLabel}
          </Money>
        </div>
        <input
          type="range"
          min={0}
          max={MAX_MONTHLY}
          step={100}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          // Thumb size is a daisyUI CSS var, overridden inline so only this
          // slider gets a larger (touch-friendly) thumb — a global `.range`
          // override would resize every other slider in the app too.
          style={{ "--range-thumb-size": "1.75rem" } as React.CSSProperties}
          className="range range-primary range-sm py-2"
        />
      </label>
    </div>
  );
};
