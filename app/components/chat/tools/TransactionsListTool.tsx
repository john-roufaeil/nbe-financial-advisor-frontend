import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ArrowDownCircle, ArrowUpCircle, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TransactionsListResult } from "@/lib/demo-financials";
import { formatDate } from "@/lib/format";
import { Money } from "@/components/shared/Money";
import { HighlightStatCard } from "@/components/chat/tools/HighlightStatCard";

export const TransactionsListTool: ToolCallMessagePartComponent = ({ result }) => {
  const { t } = useTranslation();
  const data = result as TransactionsListResult | undefined;
  if (!data) return null;

  const currencyLabel = t(`currency.${data.currency}`, data.currency);
  const totalIncome = data.transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = data.transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="border-base-300 bg-base-100 animate-entry my-2 overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-base-300 bg-base-200 flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
          <Receipt data-no-flip className="size-4" />
        </span>
        <p className="text-sm font-semibold">{t("data.transactions")}</p>
      </div>
      <div className="flex gap-3 p-3 pb-0">
        <HighlightStatCard
          icon={ArrowUpCircle}
          colorClass="bg-success text-success-content"
          label={t("data.filters.income")}
          value={
            <Money>
              {totalIncome.toLocaleString()} {currencyLabel}
            </Money>
          }
        />
        <HighlightStatCard
          icon={ArrowDownCircle}
          colorClass="bg-neutral text-neutral-content"
          label={t("data.filters.expense")}
          value={
            <Money>
              {totalExpense.toLocaleString()} {currencyLabel}
            </Money>
          }
        />
      </div>
      <ul className="flex flex-col gap-2 p-3">
        {data.transactions.map((tx) => {
          const isIncome = tx.type === "income";
          const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
          return (
            <li
              key={tx.id}
              className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-2.5"
            >
              <span
                data-no-flip
                className={`grid size-8 shrink-0 place-items-center rounded-full ${isIncome ? "bg-success/10 text-success" : "bg-base-200 text-base-content/60"}`}
              >
                <Icon data-no-flip className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tx.title}</p>
                <p className="text-base-content/50 text-xs">
                  {tx.category} · {formatDate(tx.datetime)}
                </p>
              </div>
              <Money
                className={`shrink-0 text-sm tabular-nums ${isIncome ? "text-success font-semibold" : "text-base-content font-bold"}`}
              >
                <span dir="ltr">
                  {isIncome ? "+" : "-"}
                  {tx.amount.toLocaleString()}{" "}
                  {t(`currency.${data.currency}`, data.currency)}
                </span>
              </Money>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
