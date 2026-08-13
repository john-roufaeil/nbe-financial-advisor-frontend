import { TriangleAlert, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAnomalies, useResolveAnomaly } from "@/queries/anomalies";
import { useAccounts } from "@/queries/accounts";
import { formatDate } from "@/lib/format";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { Tooltip } from "@/components/shared/Tooltip";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import type { AnomalyFlag, AnomalySeverity } from "@/types/anomaly";

const SEVERITY_BADGE_CLASS: Record<AnomalySeverity, string> = {
  low: "badge-ghost",
  medium: "badge-warning",
  high: "badge-error",
};

function AnomalyRow({ anomaly }: { anomaly: AnomalyFlag }) {
  const { t } = useTranslation();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const { data: accounts } = useAccounts();
  const resolveAnomaly = useResolveAnomaly();
  const account = accounts?.find((a) => a.id === anomaly.account_id);

  return (
    <li className="border-base-300 bg-base-100 flex min-w-0 items-start gap-3 rounded-lg border p-3">
      <Tooltip content={t(`anomalies.severityTooltip.${anomaly.severity}`)}>
        <span
          className={`badge ${SEVERITY_BADGE_CLASS[anomaly.severity]} mt-0.5 shrink-0 text-xs`}
        >
          {t(`anomalies.severity.${anomaly.severity}`)}
        </span>
      </Tooltip>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{anomaly.reason}</p>
        <p className="text-base-content/50 mt-1 flex flex-wrap items-center gap-1 text-xs">
          {account && <span>{account.bank_name}</span>}
          {anomaly.category && (
            <>
              {account && <span>·</span>}
              <CategoryLabel category={anomaly.category} type="expense" />
            </>
          )}
          <span>· {formatDate(anomaly.detected_at, dateFormat)}</span>
        </p>
      </div>
      <Tooltip content={t("anomalies.resolve")}>
        <button
          type="button"
          onClick={() => resolveAnomaly.mutate({ id: anomaly.id, resolved: true })}
          disabled={resolveAnomaly.isPending}
          className="btn btn-ghost btn-sm btn-square shrink-0"
          aria-label={t("anomalies.resolve")}
        >
          <Check data-no-flip className="size-4" />
        </button>
      </Tooltip>
    </li>
  );
}

/**
 * Unresolved anomalies from the backend's post-ingestion analysis (large or
 * duplicate-looking charges). Renders nothing when there's none — a heads-up,
 * not a permanent dashboard fixture.
 */
export function AnomaliesCard() {
  const { t } = useTranslation();
  const {
    data: anomalies,
    isPending,
    isError,
    refetch,
  } = useAnomalies({ resolved: false });

  if (isPending) {
    return (
      <CardSkeleton
        icon={TriangleAlert}
        className="animate-entry"
        rows={[{ kind: "progress" }]}
      />
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} className="animate-entry h-40" />;
  }

  if (anomalies.length === 0) return null;

  return (
    <div className="card border-base-300 bg-base-100 animate-entry min-w-0 border shadow-sm">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-warning/10 text-warning grid size-9 shrink-0 place-items-center rounded-lg">
            <TriangleAlert className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">{t("anomalies.title")}</h2>
        </div>
        <ul className="flex flex-col gap-2">
          {anomalies.map((anomaly) => (
            <AnomalyRow key={anomaly.id} anomaly={anomaly} />
          ))}
        </ul>
      </div>
    </div>
  );
}
