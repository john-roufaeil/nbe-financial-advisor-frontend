import { Bell, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotificationsStore } from "@/store/use-notifications-store";
import { useNotificationsModalStore } from "@/store/use-notifications-modal-store";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { EmptyState } from "@/components/shared/QueryState";
import { formatDateTime } from "@/lib/format";

const RECENT_COUNT = 3;

/** Compact dashboard summary of the same notifications shown in the sidebar
 * bell's modal — clicking it or "View all" opens that modal rather than
 * navigating, since notifications have no dedicated page. */
export function NotificationsCard() {
  const { t } = useTranslation();
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const notifications = useNotificationsStore((s) => s.notifications);
  const openNotifications = useNotificationsModalStore((s) => s.open);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const recent = notifications.slice(0, RECENT_COUNT);

  return (
    <button
      type="button"
      onClick={() => openNotifications()}
      className="card border-base-300 bg-base-100 hover:border-primary group animate-entry h-40 w-full border text-start shadow-sm transition-colors"
    >
      <div className="card-body flex h-full min-h-0 flex-col gap-3 p-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Bell className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base-content text-sm font-semibold">
              {t("settings.notifications.title")}
            </h3>
            {unreadCount > 0 && (
              <p className="text-base-content/50 text-xs">
                {t("settings.notifications.newCount", { count: unreadCount })}
              </p>
            )}
          </div>
          <ChevronRight className="text-base-content/30 group-hover:text-primary size-4 shrink-0 transition-[color,translate] ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </div>

        {recent.length > 0 ? (
          <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {recent.map((n) => (
              <li key={n.id} className="flex items-center gap-2">
                {!n.read && (
                  <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm">{n.title}</span>
                <span className="text-base-content/40 shrink-0 text-xs">
                  {formatDateTime(n.createdAt, timeFormat, t, dateFormat)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="flex-1" label={t("settings.notifications.empty")} />
        )}
      </div>
    </button>
  );
}
