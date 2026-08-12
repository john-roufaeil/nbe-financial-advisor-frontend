import { useTranslation } from "react-i18next";
import { Landmark } from "lucide-react";
import { useTransactions } from "@/queries/transactions";
import { useNumberDisplay } from "@/lib/use-number-display";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import { Money } from "@/components/shared/Money";

function periodBounds(period: string): { from: string; to: string } {
  const [year, month] = period.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${period}-01`, to: `${period}-${String(lastDay).padStart(2, "0")}` };
}

/**
 * Uses GET /transactions instead of monthly-summaries' top_merchants, which sums
 * both directions per merchant with no way to tell which (e.g. "Employer Payroll"
 * showed up as a top merchant) — transactions carry a real signed `type`.
 */
export function BudgetTopTransactions({ period }: { period: string }) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const { from, to } = periodBounds(period);
  const { data, isPending, isError, refetch } = useTransactions({ from, to, limit: 100 });

  const top = [...(data?.items ?? [])].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="border-base-300 bg-base-100 animate-entry flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
          <Landmark data-no-flip className="size-4" />
        </span>
        {t("budget.topTransactions.title")}
      </h2>

      {isPending ? (
        <ListSkeleton rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : top.length === 0 ? (
        <EmptyState label={t("budget.topTransactions.empty")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {top.map((txn) => {
            const isIncome = txn.type === "income";
            return (
              <li
                key={txn.id}
                className="border-base-300 flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
              >
                <span className="min-w-0 truncate">
                  {txn.title || t("budget.topTransactions.unknown")}
                </span>
                <Money
                  className={`shrink-0 font-medium tabular-nums ${isIncome ? "text-success" : "text-base-content"}`}
                >
                  <span dir="ltr">
                    {isIncome ? "+" : "-"}
                    {formatN(txn.amount)}
                  </span>
                </Money>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
