import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { formatDate } from "@/lib/format";
import { AdminPanelShell, ADMIN_PAGE_SIZE } from "@/components/admin/AdminPanelShell";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Tooltip } from "@/components/shared/Tooltip";
import { useAdminIssues, useUpdateAdminIssue } from "@/queries/admin";
import { ISSUE_STATUSES, type AdminIssue, type IssueStatus } from "@/types/admin";

const STATUS_BADGE: Record<IssueStatus, string> = {
  open: "badge-error badge-outline",
  in_review: "badge-warning badge-outline",
  resolved: "badge-success badge-outline",
  dismissed: "badge-ghost",
};

type StatusFilter = "" | IssueStatus;

/** Triage board: every reported issue across all users, status editable inline. */
export function IssuesPanel() {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const query = useAdminIssues({
    limit: ADMIN_PAGE_SIZE,
    offset,
    status: statusFilter || undefined,
  });
  const updateMutation = useUpdateAdminIssue();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewing, setViewing] = useState<AdminIssue | null>(null);

  function onStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setOffset(0);
  }

  function openView(issue: AdminIssue) {
    setViewing(issue);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <AdminPanelShell
        isLoading={query.isLoading}
        isError={query.isError}
        refetch={query.refetch}
        count={query.data?.count ?? 0}
        offset={offset}
        onOffsetChange={setOffset}
        emptyLabel={t("admin.issues.empty")}
        filters={
          <select
            className="select select-bordered select-sm w-auto"
            value={statusFilter}
            aria-label={t("admin.issues.filterStatus")}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          >
            <option value="">{t("admin.issues.filterAll")}</option>
            {ISSUE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`admin.issues.statuses.${status}`)}
              </option>
            ))}
          </select>
        }
      >
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.issues.columns.description")}</th>
              <th>{t("admin.columns.user")}</th>
              <th>{t("admin.columns.createdAt")}</th>
              <th>{t("admin.issues.columns.resolvedAt")}</th>
              <th>{t("admin.issues.columns.status")}</th>
              <th>{t("admin.issues.changeStatus")}</th>
              <th className="text-end">{t("admin.columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.results.map((issue) => (
              <tr key={issue.id}>
                <td className="max-w-md">
                  <p className="line-clamp-3 whitespace-pre-line">{issue.description}</p>
                </td>
                <td>
                  <span className="font-mono text-xs" title={issue.user_id}>
                    {issue.user_id.slice(0, 8)}…
                  </span>
                </td>
                <td>{formatDate(issue.created_at)}</td>
                <td>{issue.resolved_at ? formatDate(issue.resolved_at) : "—"}</td>
                <td>
                  <span
                    className={`badge badge-sm shrink-0 whitespace-nowrap ${STATUS_BADGE[issue.status]}`}
                  >
                    {t(`admin.issues.statuses.${issue.status}`)}
                  </span>
                </td>
                <td>
                  <select
                    className="select select-bordered select-sm w-auto"
                    value={issue.status}
                    disabled={updateMutation.isPending}
                    aria-label={t("admin.issues.changeStatus")}
                    onChange={(e) =>
                      updateMutation.mutate({
                        id: issue.id,
                        status: e.target.value as IssueStatus,
                      })
                    }
                  >
                    {ISSUE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(`admin.issues.statuses.${status}`)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="flex justify-end">
                    <Tooltip content={t("admin.issues.viewDetails")}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={() => openView(issue)}
                        aria-label={t("admin.issues.viewDetails")}
                      >
                        <Eye className="size-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminPanelShell>
      <IssueDetailModal ref={dialogRef} issue={viewing} />
    </>
  );
}

function IssueDetailModal({
  ref,
  issue,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  issue: AdminIssue | null;
}) {
  const { t } = useTranslation();

  return (
    <BaseModal ref={ref} title={t("admin.issues.detailsTitle")}>
      {issue && (
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <span className="text-base-content/60 text-xs">
              {t("admin.issues.columns.description")}
            </span>
            <p className="mt-1 whitespace-pre-line">{issue.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.columns.user")}
              </span>
              <p className="font-mono">{issue.user_id}</p>
            </div>
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.issues.columns.status")}
              </span>
              <p>
                <span
                  className={`badge badge-sm shrink-0 whitespace-nowrap ${STATUS_BADGE[issue.status]}`}
                >
                  {t(`admin.issues.statuses.${issue.status}`)}
                </span>
              </p>
            </div>
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.columns.createdAt")}
              </span>
              <p>{formatDate(issue.created_at)}</p>
            </div>
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.issues.columns.resolvedAt")}
              </span>
              <p>{issue.resolved_at ? formatDate(issue.resolved_at) : "—"}</p>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
