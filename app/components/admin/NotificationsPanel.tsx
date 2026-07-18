import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/QueryState";
import { useNotificationsStore } from "@/store/use-notifications-store";
import { toastSuccess } from "@/lib/toast";
import { formatDateTime } from "@/lib/format";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";

interface BroadcastFormValues {
  title: string;
  body: string;
}

/** Broadcast composer — sends an "everyone" notification. Frontend-only for
 * now: writes straight into the shared notifications store (no API yet), so
 * every user reading that store sees it immediately. */
export function NotificationsPanel() {
  const { t } = useTranslation();
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const notifications = useNotificationsStore((s) => s.notifications);
  const sendBroadcast = useNotificationsStore((s) => s.sendBroadcast);
  const broadcasts = notifications.filter((n) => n.audience === "everyone");

  const { register, handleSubmit, reset, formState } = useForm<BroadcastFormValues>({
    defaultValues: { title: "", body: "" },
  });

  function onSubmit(values: BroadcastFormValues) {
    sendBroadcast(values);
    reset();
    toastSuccess("admin.notifications.toastSent");
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border-base-300 bg-base-100 flex flex-col gap-3 rounded-xl border p-4 shadow-sm"
      >
        <h3 className="text-sm font-semibold">{t("admin.notifications.composeTitle")}</h3>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.notifications.fields.title")}</span>
          <input
            type="text"
            required
            className="input input-bordered w-full"
            {...register("title")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.notifications.fields.body")}</span>
          <textarea
            required
            rows={3}
            className="textarea textarea-bordered w-full"
            {...register("body")}
          />
        </label>
        <div>
          <Button
            type="submit"
            className="btn btn-primary btn-sm"
            loading={formState.isSubmitting}
          >
            <Send className="size-4" />
            {t("admin.notifications.send")}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("admin.notifications.sentTitle")}</h3>
        {broadcasts.length === 0 ? (
          <EmptyState label={t("admin.notifications.empty")} />
        ) : (
          <div className="border-base-300 bg-base-100 overflow-x-auto rounded-xl border shadow-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("admin.notifications.fields.title")}</th>
                  <th>{t("admin.notifications.fields.body")}</th>
                  <th>{t("admin.columns.createdAt")}</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((n) => (
                  <tr key={n.id}>
                    <td className="font-medium">{n.title}</td>
                    <td className="text-base-content/70 max-w-md">{n.body}</td>
                    <td>{formatDateTime(n.createdAt, timeFormat, t, dateFormat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
