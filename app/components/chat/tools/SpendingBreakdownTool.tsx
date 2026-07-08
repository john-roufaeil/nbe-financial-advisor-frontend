import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { PieChart, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SpendingBreakdownResult } from "@/lib/demo-financials";
import { CATEGORY_BAR_COLORS } from "@/lib/category-colors";

export const SpendingBreakdownTool: ToolCallMessagePartComponent = ({
  result,
  status,
}) => {
  const { t } = useTranslation();
  const data = result as SpendingBreakdownResult | undefined;

  function formatAmount(amount: number, currency: string) {
    return `${amount.toLocaleString()} ${t(`currency.${currency}`, currency)}`;
  }

  if (!data || status.type === "running") {
    return (
      <div className="border-base-300 bg-base-100 text-base-content/60 my-2 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t("chat.tools.spending.loading")}
      </div>
    );
  }

  return (
    <div className="border-base-300 bg-base-100 my-2 overflow-hidden rounded-2xl border shadow-sm">
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
          <p className="text-sm font-semibold tabular-nums">
            {formatAmount(data.total, data.currency)}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-3 p-4">
        {data.categories.map((cat, i) => (
          <li key={cat.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{cat.name}</span>
              <span className="text-base-content/70 tabular-nums">
                {formatAmount(cat.amount, data.currency)} · {cat.pct}%
              </span>
            </div>
            <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]}`}
                style={{ width: `${cat.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
