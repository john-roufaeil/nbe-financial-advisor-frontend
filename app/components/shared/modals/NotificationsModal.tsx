import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Megaphone, User } from "lucide-react";
import { useNotifications } from "@/lib/use-notifications";
import { useNotificationsStore } from "@/store/use-notifications-store";
import { useNotificationsModalStore } from "@/store/use-notifications-modal-store";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { EmptyState } from "@/components/shared/QueryState";
import { formatDateTime } from "@/lib/format";
import type { AppNotification, NotificationAudience } from "@/types/notification";

const TABS: { audience: NotificationAudience; icon: typeof Megaphone }[] = [
  { audience: "everyone", icon: Megaphone },
  { audience: "account", icon: User },
];

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const { t } = useTranslation();
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);

  return (
    <li>
      <button
        type="button"
        onClick={() => onRead(notification.id)}
        className={`border-base-300 flex w-full flex-col gap-0.5 rounded-lg border p-3 text-start transition-colors ${
          notification.read ? "bg-base-100" : "bg-primary/5"
        }`}
      >
        <div className="flex items-center gap-2">
          {!notification.read && (
            <span className="bg-primary size-1.5 shrink-0 rounded-full" />
          )}
          <span className="flex-1 text-sm font-medium">{notification.title}</span>
          <span className="text-base-content/40 shrink-0 text-xs">
            {formatDateTime(notification.createdAt, timeFormat, t, dateFormat)}
          </span>
        </div>
        <p className="text-base-content/60 text-xs">{notification.body}</p>
      </button>
    </li>
  );
}

export function NotificationsModal() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const { isOpen, tab, close, setTab } = useNotificationsModalStore();
  const notifications = useNotifications();
  const markRead = useNotificationsStore((s) => s.markRead);

  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);

  const items = notifications.filter((n) => n.audience === tab);

  return (
    <BaseModal
      ref={ref}
      onClose={close}
      title={t("settings.notifications.title")}
      icon={
        <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-full">
          <Bell className="size-4.5" />
        </span>
      }
      className="max-w-md"
    >
      <div className="flex flex-col gap-3">
        <div
          role="tablist"
          className="border-base-300 bg-base-200/60 flex gap-1 rounded-full border p-1"
        >
          {TABS.map(({ audience, icon: Icon }) => (
            <button
              key={audience}
              type="button"
              role="tab"
              aria-selected={tab === audience}
              onClick={() => setTab(audience)}
              className={`focus-visible:outline-primary/50 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                tab === audience
                  ? "bg-base-100 text-primary shadow-sm"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <Icon data-no-flip className="size-3.5" />
              {t(`settings.notifications.tabs.${audience}`)}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <EmptyState className="py-6" label={t("settings.notifications.empty")} />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((n) => (
              <NotificationRow key={n.id} notification={n} onRead={markRead} />
            ))}
          </ul>
        )}
      </div>
    </BaseModal>
  );
}
