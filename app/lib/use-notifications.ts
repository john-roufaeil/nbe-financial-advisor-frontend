import { useTranslation } from "react-i18next";
import { useAnomalies } from "@/queries/anomalies";
import { useNotificationsStore } from "@/store/use-notifications-store";
import type { AppNotification } from "@/types/notification";
import type { AnomalyFlag } from "@/types/anomaly";

/**
 * "account"-audience entries, sourced from GET /analytics/anomalies
 * (kept fresh by the anomaly_detected SSE event — use-event-stream.ts).
 * Always rendered unread: there's no "seen" concept on an AnomalyFlag, only
 * `resolved` — resolving one (AnomaliesCard, dashboard) is what removes it
 * from this list, via the same query this hook reads.
 */
function anomalyToNotification(anomaly: AnomalyFlag, title: string): AppNotification {
  return {
    id: `anomaly-${anomaly.id}`,
    audience: "account",
    title,
    body: anomaly.reason,
    createdAt: anomaly.detected_at,
    read: false,
  };
}

/**
 * The bell icon's real notification feed: local "everyone" broadcasts (the
 * only thing useNotificationsStore still owns — genuinely frontend-only,
 * see its docstring) merged with live "account" entries derived from
 * backend data. Anomalies are the only account-scoped source today; add
 * more here if/when there's another backend signal worth surfacing (e.g. a
 * real in-app Notification model, if one ever exists — see the audit
 * discussed in this session, there isn't one yet).
 */
export function useNotifications(): AppNotification[] {
  const { t } = useTranslation();
  const local = useNotificationsStore((s) => s.notifications);
  const { data: anomalies } = useAnomalies({ resolved: false });
  const anomalyTitle = t("settings.notifications.anomalyTitle");
  const derived = (anomalies ?? []).map((a) => anomalyToNotification(a, anomalyTitle));

  return [...local, ...derived].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
