import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareWarning, Plus } from "lucide-react";
import { useIssues } from "@/queries/issues";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { formatDateTime } from "@/lib/format";
import { EmptyState, ErrorState } from "@/components/shared/QueryState";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { ReportIssueModal } from "@/components/profile/ReportIssueModal";
import type { IssueStatus } from "@/types/issue";

const STATUS_TONE: Record<IssueStatus, string> = {
  open: "bg-info/10 text-info",
  in_review: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  dismissed: "bg-base-300 text-base-content/60",
};

export function IssuesSection() {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDialogElement>(null);
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const { data, isPending, isError, refetch } = useIssues({ limit: 10 });

  return (
    <section className="animate-entry flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
          <MessageSquareWarning className="size-4.5" />
        </span>
        <div className="flex-1">
          <h2 className="card-title text-base">{t("settings.issues.title")}</h2>
          <p className="text-base-content/60 text-xs">{t("settings.issues.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => modalRef.current?.showModal()}
          className="btn btn-outline btn-sm gap-1.5"
        >
          <Plus className="size-4" />
          {t("settings.issues.reportButton")}
        </button>
      </div>

      {isPending ? (
        <ListSkeleton rows={2} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState
          compact
          icon={MessageSquareWarning}
          label={t("settings.issues.empty")}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.items.map((issue) => (
            <li key={issue.id} className="bg-base-200 flex flex-col gap-1 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[issue.status]}`}
                >
                  {t(`settings.issues.statuses.${issue.status}`)}
                </span>
                <span className="text-base-content/40 text-xs">
                  {formatDateTime(issue.createdAt, timeFormat, t, dateFormat)}
                </span>
              </div>
              <p className="text-base-content/70 text-sm">{issue.description}</p>
            </li>
          ))}
        </ul>
      )}

      <ReportIssueModal ref={modalRef} />
    </section>
  );
}
