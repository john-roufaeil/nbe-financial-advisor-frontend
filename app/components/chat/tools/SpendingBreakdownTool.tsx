import { useState } from "react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { PieChart, BarChart3, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SpendingBreakdownResult } from "@/lib/demo-financials";
import { CATEGORY_BAR_COLORS } from "@/lib/category-colors";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { CategoryBarChart } from "@/components/chat/tools/CategoryBarChart";
import { Money } from "@/components/shared/Money";
import { useNumberDisplay } from "@/lib/use-number-display";

type View = "pie" | "bar";

export const SpendingBreakdownTool: ToolCallMessagePartComponent = ({
  result,
  status,
}) => {
  const { t } = useTranslation();
  const data = result as SpendingBreakdownResult | undefined;
  const [view, setView] = useState<View>("pie");
  const [selected, setSelected] = useState<string | null>(null);
  const formatN = useNumberDisplay();

  function formatAmount(amount: number, currency: string) {
    return `${formatN(amount)} ${t(`currency.${currency}`, currency)}`;
  }

  function categoryLabel(name: string) {
    return t(`common.categories.${name}`, name);
  }

  if (!data || status.type === "running") {
    return (
      <div className="border-base-300 bg-base-100 text-base-content/60 my-2 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
        <Loader2 data-no-flip className="size-4 animate-spin" />
        {t("chat.tools.spending.loading")}
      </div>
    );
  }

  function toggleSelected(name: string) {
    setSelected((s) => (s === name ? null : name));
  }

  return (
    <div className="border-base-300 bg-base-100 animate-entry my-2 overflow-hidden rounded-xl border shadow-sm">
      <div className="border-base-300 bg-base-200 flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
            <PieChart className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{t("chat.tools.spending.title")}</p>
            <p className="text-base-content/60 text-xs">{data.month}</p>
          </div>
        </div>
        <div className="text-end leading-tight">
          <p className="text-base-content/60 text-xs">{t("chat.tools.spending.total")}</p>
          <Money className="text-sm font-semibold tabular-nums">
            {formatAmount(data.total, data.currency)}
          </Money>
        </div>
      </div>

      <div role="tablist" className="border-base-300 flex gap-1 border-b px-3 pt-2">
        <button
          type="button"
          role="tab"
          aria-selected={view === "pie"}
          onClick={() => setView("pie")}
          className={`focus-visible:outline-primary/50 flex cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
            view === "pie"
              ? "border-primary text-primary border-x border-t border-b-2 border-b-transparent"
              : "text-base-content/50 hover:text-base-content"
          }`}
        >
          <PieChart data-no-flip className="size-3.5" />
          {t("chat.tools.spending.pieTab")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "bar"}
          onClick={() => setView("bar")}
          className={`focus-visible:outline-primary/50 flex cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
            view === "bar"
              ? "border-primary text-primary border-x border-t border-b-2 border-b-transparent"
              : "text-base-content/50 hover:text-base-content"
          }`}
        >
          <BarChart3 data-no-flip className="size-3.5" />
          {t("chat.tools.spending.barTab")}
        </button>
      </div>

      {view === "pie" ? (
        <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-start">
          <CategoryDonutChart
            size={96}
            strokeWidth={14}
            slices={data.categories.map((c) => ({
              name: c.name,
              displayName: categoryLabel(c.name),
              value: c.amount,
            }))}
            selectedName={selected}
            onSelectName={toggleSelected}
          />
          <ul className="flex w-full min-w-0 flex-1 flex-col gap-3">
            {data.categories.map((cat, i) => (
              <li key={cat.name}>
                <button
                  type="button"
                  onClick={() => toggleSelected(cat.name)}
                  className={`focus-visible:outline-primary/50 flex w-full cursor-pointer flex-col gap-1 rounded-md p-1 text-start transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    selected != null && selected !== cat.name
                      ? "opacity-40"
                      : "opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{categoryLabel(cat.name)}</span>
                    <Money className="text-base-content/70 tabular-nums">
                      {formatAmount(cat.amount, data.currency)} · {cat.pct}%
                    </Money>
                  </div>
                  <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full ${CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]}`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-4">
          <CategoryBarChart
            data={data.categories.map((c) => ({
              name: c.name,
              displayName: categoryLabel(c.name),
              value: c.amount,
              label: formatAmount(c.amount, data.currency),
            }))}
            selectedName={selected}
            onSelectName={toggleSelected}
          />
        </div>
      )}
    </div>
  );
};
