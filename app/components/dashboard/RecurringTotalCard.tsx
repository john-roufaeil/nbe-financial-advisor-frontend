import { Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRecurringCharges } from "@/queries/recurring-charges";
import { useNumberDisplay } from "@/lib/use-number-display";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";

/** Estimated total monthly recurring spend — RecurringChargesCard lists each
 * charge individually but never totals them. Reuses the same
 * useRecurringCharges() query that card already fetches, so this is free. */
export function RecurringTotalCard({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const { data: charges } = useRecurringCharges();
  const currencyLabel = t(`currency.${currency}`, currency);
  if (!charges || charges.length === 0) return null;
  const total = charges.reduce((sum, c) => sum + c.avgAmount, 0);

  return (
    <Tooltip content={t("dashboard.recurringTotal.tooltip")} className="w-full">
      <div className="card border-base-300 bg-base-100 animate-entry h-full w-full border shadow-sm">
        <div className="flex items-center gap-2 p-3">
          <span className="bg-error/10 text-error grid size-8 shrink-0 place-items-center rounded-lg">
            <Repeat data-no-flip className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base-content/60 truncate text-xs">
              {t("dashboard.recurringTotal.label")}
            </p>
            <p className="truncate text-base font-semibold tabular-nums">
              <Money>
                {formatN(total)} {currencyLabel}
              </Money>
            </p>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}
