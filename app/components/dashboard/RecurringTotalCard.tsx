import { Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRecurringCharges } from "@/queries/recurring-charges";
import { useNumberDisplay } from "@/lib/use-number-display";
import { Money } from "@/components/shared/Money";
import { InsightTile } from "@/components/dashboard/InsightTile";

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
    <InsightTile
      icon={Repeat}
      tone="bg-error/10 text-error"
      label={t("dashboard.recurringTotal.label")}
      value={
        <Money>
          {formatN(total)} {currencyLabel}
        </Money>
      }
      tooltip={t("dashboard.recurringTotal.tooltip")}
    />
  );
}
