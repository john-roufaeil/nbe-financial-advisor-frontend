import { useTranslation } from "react-i18next";
import { useAnomalies } from "@/queries/anomalies";
import type { AppNotification } from "@/types/notification";
import type { AnomalyFlag } from "@/types/anomaly";

function anomalyToNotification(anomaly: AnomalyFlag, title: string): AppNotification {
  return {
    id: `anomaly-${anomaly.id}`,
    title,
    body: anomaly.reason,
    createdAt: anomaly.detected_at,
  };
}

/**
 * The bell icon's notification feed — sourced entirely from
 * GET /analytics/anomalies (kept fresh by the anomaly_detected SSE event,
 * see use-event-stream.ts). There is no other backend notification source
 * today; resolving an anomaly (AnomaliesCard, dashboard) is what removes it
 * from this list, via the same query this hook reads.
 */
export function useNotifications(): AppNotification[] {
  const { t } = useTranslation();
  const { data: anomalies } = useAnomalies({ resolved: false });
  const anomalyTitle = t("settings.notifications.anomalyTitle");

  return (anomalies ?? [])
    .map((a) => anomalyToNotification(a, anomalyTitle))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
