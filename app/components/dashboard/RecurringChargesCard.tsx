import { ArrowDownCircle, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRecurringCharges } from "@/queries/recurring-charges";
import { formatDate } from "@/lib/format";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { useNumberDisplay } from "@/lib/use-number-display";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import type { RecurringCharge } from "@/types/recurring-charge";

function RecurringChargeItem({
  charge,
  currency,
}: {
  charge: RecurringCharge;
  currency: string;
}) {
  const { t } = useTranslation();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const formatN = useNumberDisplay();
  const currencyLabel = t(`currency.${currency}`, currency);

  return (
    <li className="border-base-300 bg-base-100 flex min-w-0 flex-col gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="bg-error/10 text-error grid size-8 shrink-0 place-items-center rounded-lg">
          <ArrowDownCircle data-no-flip className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{charge.merchantNormalized}</p>
          <p className="text-base-content/50 text-xs capitalize">{charge.frequency}</p>
        </div>
      </div>
      <div className="border-base-200 flex flex-col gap-0.5 border-t pt-2">
        <p className="text-sm font-semibold tabular-nums">
          {formatN(charge.avgAmount)} {currencyLabel}
        </p>
        {charge.nextExpectedDate && (
          <p className="text-base-content/50 text-xs">
            {t("dashboard.recurringCharges.next", {
              date: formatDate(charge.nextExpectedDate, dateFormat),
            })}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Detected subscriptions/regular bills — same "renders nothing when there's
 * nothing to show" shape as AnomaliesCard, since this is read-only over a
 * backend detection job (see types/recurring-charge.ts).
 */
export function RecurringChargesCard({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const { data: charges, isPending, isError, refetch } = useRecurringCharges();

  if (isPending) {
    return (
      <CardSkeleton
        icon={Repeat}
        className="animate-entry"
        rows={[{ kind: "progress" }]}
      />
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} className="animate-entry h-40" />;
  }

  if (charges.length === 0) return null;

  return (
    <div className="card border-base-300 bg-base-100 animate-entry min-w-0 border shadow-sm">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-info/10 text-info grid size-9 shrink-0 place-items-center rounded-lg">
            <Repeat className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">
            {t("dashboard.recurringCharges.title")}
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {charges.map((charge) => (
            <RecurringChargeItem key={charge.id} charge={charge} currency={currency} />
          ))}
        </ul>
      </div>
    </div>
  );
}
