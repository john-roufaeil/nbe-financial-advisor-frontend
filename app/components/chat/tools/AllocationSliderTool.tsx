import { useState } from "react";
import { z } from "zod";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { SlidersHorizontal, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdateBudget } from "@/queries/budget";
import { categoryIcon } from "@/lib/constants/category-icons";
import { ToolPayloadError } from "@/components/chat/tools/ToolPayloadError";

/** Matches `widget.payload` for `allocation_slider` (ai-service's `Allocation`
 * schema, app/features/chat/schemas/widgets.py) — a slimmer shape than the
 * dashboard's `Allocation` type: no amount/currency, just the percentages the
 * chat widget lets the user adjust and confirm.
 *
 * The field is `percentage`, not `allocated_percentage` — using the wrong name
 * here previously made every render fail safeParse silently.
 * `allocated_percentage` is the *dashboard* budget API's field name
 * (AllocationInputSerializer), used below only for the outgoing
 * useUpdateBudget mutation, never for reading this incoming payload.
 *
 * Validated at runtime since `result` is LLM-originated, not a typed REST response. */
const AllocationSliderPayloadSchema = z.object({
  allocations: z.array(
    z.object({
      category: z.string(),
      percentage: z.number(),
    }),
  ),
});
type AllocationSliderPayload = z.infer<typeof AllocationSliderPayloadSchema>;

/** Guards against float drift (e.g. 33.33 + 33.33 + 33.34 = 100.00000000000001). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const AllocationSliderTool: ToolCallMessagePartComponent = ({ result }) => {
  const { t } = useTranslation();
  const parsed = AllocationSliderPayloadSchema.safeParse(result);
  const data: AllocationSliderPayload | undefined = parsed.success
    ? parsed.data
    : undefined;
  const updateBudget = useUpdateBudget();
  const [draft, setDraft] = useState<Record<string, number>>(() =>
    Object.fromEntries((data?.allocations ?? []).map((a) => [a.category, a.percentage])),
  );
  const [dirty, setDirty] = useState(false);

  // undefined result: still streaming in, render nothing yet. Present but
  // malformed: a genuine payload/shape mismatch worth surfacing.
  if (result !== undefined && !parsed.success) return <ToolPayloadError />;
  if (!data) return null;

  const categories = data.allocations.map((a) => a.category);
  const total = round2(categories.reduce((sum, c) => sum + (draft[c] ?? 0), 0));
  const remaining = round2(100 - total);

  function setPercentage(category: string, value: number) {
    setDraft((d) => ({ ...d, [category]: value }));
    setDirty(true);
  }

  function handleConfirm() {
    updateBudget.mutate(
      {
        allocations: categories.map((category) => ({
          category,
          allocated_percentage: draft[category] ?? 0,
        })),
        changed_via: "chat",
      },
      { onSuccess: () => setDirty(false) },
    );
  }

  const saved = !dirty && updateBudget.isSuccess;

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
            {t("dashboard.budget.allocatedOfTotal", { total: Math.min(total, 100) })}
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
          const value = draft[category] ?? 0;
          return (
            <label key={category} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium capitalize">
                  <Icon data-no-flip className="text-base-content/50 size-3.5 shrink-0" />
                  {t(`dashboard.budget.categoryNames.${category}`, category)}
                </span>
                <span className="tabular-nums">{value}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={value}
                onChange={(e) => setPercentage(category, Number(e.target.value))}
                className="range range-primary range-sm"
              />
            </label>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={remaining !== 0 || updateBudget.isPending || saved}
        className="btn btn-primary btn-sm gap-1.5 self-end"
      >
        {saved && <Check data-no-flip className="size-4" />}
        {saved ? t("chat.tools.allocation.updated") : t("chat.tools.allocation.confirm")}
      </button>
    </div>
  );
};
