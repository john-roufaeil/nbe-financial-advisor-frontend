import { Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRecurringCharges } from "@/queries/recurring-charges";
import { formatDate } from "@/lib/format";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { useNumberDisplay } from "@/lib/use-number-display";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import type { RecurringCharge } from "@/types/recurring-charge";

function RecurringChargeRow({ charge }: { charge: RecurringCharge }) {
  const { t } = useTranslation();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const formatN = useNumberDisplay();

  return (
    <li className="border-base-300 bg-base-100 flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{charge.merchantNormalized}</p>
        <p className="text-base-content/50 mt-0.5 text-xs capitalize">
          {charge.frequency}
        </p>
      </div>
      <div className="shrink-0 text-end">
        <p className="text-sm font-medium tabular-nums">{formatN(charge.avgAmount)}</p>
        {charge.nextExpectedDate && (
          <p className="text-base-content/50 mt-0.5 text-xs">
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
export function RecurringChargesCard() {
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
        <ul className="flex flex-col gap-2">
          {charges.map((charge) => (
            <RecurringChargeRow key={charge.id} charge={charge} />
          ))}
        </ul>
      </div>
    </div>
  );
}
