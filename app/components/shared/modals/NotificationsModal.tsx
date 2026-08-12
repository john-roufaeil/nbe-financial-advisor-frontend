import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/use-notifications";
import { useNotificationsModalStore } from "@/store/use-notifications-modal-store";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { EmptyState } from "@/components/shared/QueryState";
import { formatDateTime } from "@/lib/format";
import type { AppNotification } from "@/types/notification";

function NotificationRow({ notification }: { notification: AppNotification }) {
  const { t } = useTranslation();
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);

  return (
    <li className="border-base-300 bg-primary/5 flex flex-col gap-0.5 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span className="bg-primary size-1.5 shrink-0 rounded-full" />
        <span className="flex-1 text-sm font-medium">{notification.title}</span>
        <span className="text-base-content/40 shrink-0 text-xs">
          {formatDateTime(notification.createdAt, timeFormat, t, dateFormat)}
        </span>
      </div>
      <p className="text-base-content/60 text-xs">{notification.body}</p>
    </li>
  );
}

export function NotificationsModal() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const { isOpen, close } = useNotificationsModalStore();
  const notifications = useNotifications();

  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);

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
      {notifications.length === 0 ? (
        <EmptyState className="py-6" label={t("settings.notifications.empty")} />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </ul>
      )}
    </BaseModal>
  );
}
