import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { SlidersHorizontal, Check, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdateBudget } from "@/queries/budget";
import { categoryIcon } from "@/lib/constants/category-icons";
import { ToolPayloadError } from "@/components/chat/tools/ToolPayloadError";

/** Matches `widget.payload` for `allocation_slider` (ai-service's `Allocation`
 * model). Field is `percentage`, not `allocated_percentage` — using the wrong
 * name here previously made every render fail safeParse silently.
 * Validated at runtime since `result` is LLM-originated, not a typed REST response. */
const AllocationSliderPayloadSchema = z.object({
  allocations: z.array(
    z.object({
      category: z.string(),
      percentage: z.number(),
    }),
  ),
  /** Absent on the model's original proposal. Set via `addResult` once the
   * user submits — baking it into the persisted tool result (rather than
   * component state) is what makes the locked, submitted allocations survive
   * navigating away from the chat and back, instead of resetting to the
   * original proposal on remount. */
  confirmed: z.boolean().optional(),
});
type AllocationSliderPayload = z.infer<typeof AllocationSliderPayloadSchema>;

/** Guards against float drift (e.g. 33.33 + 33.33 + 33.34 = 100.00000000000001). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const BUTTON_STEP = 1;
/** Delay before a held-down +/- button starts auto-repeating, and the
 * interval between repeats once it does — lets a quick tap take a single
 * step while a hold walks the value up/down without re-clicking each time. */
const HOLD_REPEAT_DELAY_MS = 400;
const HOLD_REPEAT_INTERVAL_MS = 80;

/** A +/- button that steps once on a normal click, and auto-repeats on a
 * press-and-hold. `onClick` is suppressed for the click event that follows
 * a hold (browsers fire pointerup then click for the same interaction) so
 * a hold doesn't also take one extra step at release. */
function StepperButton({
  onStep,
  disabled,
  ariaLabel,
  icon: Icon,
}: {
  onStep: () => void;
  disabled: boolean;
  ariaLabel: string;
  icon: typeof Minus;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heldRef = useRef(false);

  function clearTimers() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }

  useEffect(() => clearTimers, []);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={() => {
        heldRef.current = false;
        timeoutRef.current = setTimeout(() => {
          heldRef.current = true;
          onStep();
          intervalRef.current = setInterval(onStep, HOLD_REPEAT_INTERVAL_MS);
        }, HOLD_REPEAT_DELAY_MS);
      }}
      onPointerUp={clearTimers}
      onPointerLeave={clearTimers}
      onPointerCancel={clearTimers}
      onClick={() => {
        if (heldRef.current) {
          heldRef.current = false;
          return;
        }
        onStep();
      }}
      className="btn btn-circle btn-ghost btn-xs shrink-0"
    >
      <Icon data-no-flip className="size-3" />
    </button>
  );
}

export const AllocationSliderTool: ToolCallMessagePartComponent = ({
  result,
  addResult,
}) => {
  const { t } = useTranslation();
  const parsed = AllocationSliderPayloadSchema.safeParse(result);
  const data: AllocationSliderPayload | undefined = parsed.success
    ? parsed.data
    : undefined;
  const updateBudget = useUpdateBudget();
  const [draft, setDraft] = useState<Record<string, number>>(() =>
    Object.fromEntries((data?.allocations ?? []).map((a) => [a.category, a.percentage])),
  );

  // undefined result: still streaming in, render nothing yet. Present but
  // malformed: a genuine payload/shape mismatch worth surfacing.
  if (result !== undefined && !parsed.success) return <ToolPayloadError />;
  if (!data) return null;

  const locked = data.confirmed === true;
  const categories = data.allocations.map((a) => a.category);
  const values = locked
    ? Object.fromEntries(data.allocations.map((a) => [a.category, a.percentage]))
    : draft;
  const total = round2(categories.reduce((sum, c) => sum + (values[c] ?? 0), 0));
  const remaining = round2(100 - total);

  function setPercentage(category: string, value: number) {
    setDraft((d) => ({ ...d, [category]: Math.min(100, Math.max(0, value)) }));
  }

  function adjustPercentage(category: string, delta: number) {
    setDraft((d) => ({
      ...d,
      [category]: Math.min(100, Math.max(0, (d[category] ?? 0) + delta)),
    }));
  }

  function handleConfirm() {
    const allocations = categories.map((category) => ({
      category,
      percentage: draft[category] ?? 0,
    }));
    updateBudget.mutate(
      {
        allocations: allocations.map(({ category, percentage }) => ({
          category,
          allocated_percentage: percentage,
        })),
        changed_via: "chat",
      },
      { onSuccess: () => addResult({ allocations, confirmed: true }) },
    );
  }

  return (
    <div className="border-base-300 bg-base-100 animate-entry my-2 flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
          <SlidersHorizontal className="size-4" />
        </span>
        <p className="text-sm font-semibold">{t("chat.tools.allocation.title")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-base-content/70">
            {t("dashboard.budget.allocatedOfTotal", { total })}
          </span>
          <span
            className={`font-semibold ${
              remaining === 0
                ? "text-success"
                : remaining < 0
                  ? "text-error"
                  : "text-warning"
            }`}
          >
            {remaining === 0
              ? t("dashboard.budget.allocationsFullyAllocated")
              : remaining < 0
                ? t("dashboard.budget.allocationsOverAllocated", {
                    amount: Math.abs(remaining),
                  })
                : t("dashboard.budget.allocationsNeedMore", { amount: remaining })}
          </span>
        </div>
        <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all ${
              remaining === 0 ? "bg-success" : remaining < 0 ? "bg-error" : "bg-warning"
            }`}
            style={{ width: `${Math.min(100, total)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const Icon = categoryIcon(category);
          const value = values[category] ?? 0;
          const categoryName = t(`dashboard.budget.categoryNames.${category}`, category);
          return (
            <div key={category} className="flex flex-col gap-1">
              <div className="flex items-center text-xs">
                <span className="flex items-center gap-1.5 font-medium capitalize">
                  <Icon data-no-flip className="text-base-content/50 size-3.5 shrink-0" />
                  {categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  disabled={locked}
                  onChange={(e) => setPercentage(category, Number(e.target.value))}
                  className="range range-primary range-sm flex-1"
                />
                <StepperButton
                  onStep={() => adjustPercentage(category, -BUTTON_STEP)}
                  disabled={locked || value <= 0}
                  ariaLabel={t("chat.tools.allocation.decrease", {
                    category: categoryName,
                  })}
                  icon={Minus}
                />
                <span className="flex w-9 items-center justify-center text-xs tabular-nums">
                  {value}%
                </span>
                <StepperButton
                  onStep={() => adjustPercentage(category, BUTTON_STEP)}
                  disabled={locked || value >= 100}
                  ariaLabel={t("chat.tools.allocation.increase", {
                    category: categoryName,
                  })}
                  icon={Plus}
                />
              </div>
            </div>
          );
        })}
      </div>

      {locked ? (
        <div className="text-success flex items-center gap-1.5 self-end text-xs font-medium">
          <Check data-no-flip className="size-4" />
          {t("chat.tools.allocation.updated")}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={remaining !== 0 || updateBudget.isPending}
          className="btn btn-primary btn-sm gap-1.5 self-end"
        >
          {t("chat.tools.allocation.confirm")}
        </button>
      )}
    </div>
  );
};
