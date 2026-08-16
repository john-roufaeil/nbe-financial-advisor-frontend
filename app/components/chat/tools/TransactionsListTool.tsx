import { z } from "zod";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ArrowDownCircle, ArrowUpCircle, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/format";
import { Money } from "@/components/shared/Money";
import { HighlightStatCard } from "@/components/chat/tools/HighlightStatCard";
import { ToolPayloadError } from "@/components/chat/tools/ToolPayloadError";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";

/** Validated at runtime, not just asserted: `result` is LLM-originated, a
 * meaningfully less trustworthy source than a typed REST response. */
const TransactionsListResultSchema = z.object({
  currency: z.string(),
  transactions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      type: z.enum(["income", "expense"]),
      amount: z.number(),
      // ISO date (YYYY-MM-DD), not a datetime: the backend stores
      // transactions.transaction_date as a DATE with no time component, so
      // there is no time-of-day to send.
      date: z.string(),
    }),
  ),
});

export const TransactionsListTool: ToolCallMessagePartComponent = ({ result }) => {
  const { t } = useTranslation();
  const parsed = TransactionsListResultSchema.safeParse(result);
  const data = parsed.success ? parsed.data : undefined;
  const formatN = useNumberDisplay();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);

  // undefined result: still streaming in, render nothing yet. Present but
  // malformed: a genuine payload/shape mismatch worth surfacing.
  if (result !== undefined && !parsed.success) return <ToolPayloadError />;
  if (!data) return null;

  const currencyLabel = t(`currency.${data.currency}`, data.currency);
  const totalIncome = data.transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = data.transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="border-base-300 bg-base-100 animate-entry my-2 overflow-hidden rounded-xl border shadow-sm">
      <div className="border-base-300 bg-base-200 flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
          <Receipt data-no-flip className="size-4" />
        </span>
        <p className="text-sm font-semibold">{t("transactions.title")}</p>
      </div>
      <div className="flex flex-wrap gap-3 p-3 pb-0">
        <HighlightStatCard
          icon={ArrowUpCircle}
          colorClass="bg-success text-success-content"
          label={t("common.filters.income")}
          value={
            <Money>
              {formatN(totalIncome)} {currencyLabel}
            </Money>
          }
        />
        <HighlightStatCard
          icon={ArrowDownCircle}
          colorClass="bg-neutral text-neutral-content"
          label={t("common.filters.expense")}
          value={
            <Money>
              {formatN(totalExpense)} {currencyLabel}
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
                  {t(`common.categories.${tx.category}`, tx.category)} ·{" "}
                  {formatDate(tx.date, dateFormat)}
                </p>
              </div>
              <Money
                className={`shrink-0 text-sm tabular-nums ${isIncome ? "text-success font-semibold" : "text-base-content font-bold"}`}
              >
                <span dir="ltr">
                  {isIncome ? "+" : "-"}
                  {formatN(tx.amount)}
                </span>{" "}
                {t(`currency.${data.currency}`, data.currency)}
              </Money>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
