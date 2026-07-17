import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Star } from "lucide-react";
import { formatDate } from "@/lib/format";
import { AdminPanelShell, ADMIN_PAGE_SIZE } from "@/components/admin/AdminPanelShell";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Tooltip } from "@/components/shared/Tooltip";
import { useAdminFeedback } from "@/queries/admin";
import type { AdminFeedbackEntry } from "@/types/admin";

const RATINGS = [1, 2, 3, 4, 5] as const;

/** Read-only, cross-user feedback (ratings + comments) — no writes exist. */
export function FeedbackPanel() {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const query = useAdminFeedback({
    limit: ADMIN_PAGE_SIZE,
    offset,
    rating: ratingFilter || undefined,
  });

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewing, setViewing] = useState<AdminFeedbackEntry | null>(null);

  function onRatingFilterChange(value: string) {
    setRatingFilter(value ? Number(value) : "");
    setOffset(0);
  }

  function openView(entry: AdminFeedbackEntry) {
    setViewing(entry);
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
        emptyLabel={t("admin.feedback.empty")}
        filters={
          <select
            className="select select-bordered select-sm w-auto"
            value={ratingFilter}
            aria-label={t("admin.feedback.filterRating")}
            onChange={(e) => onRatingFilterChange(e.target.value)}
          >
            <option value="">{t("admin.feedback.allRatings")}</option>
            {RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        }
      >
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.feedback.columns.rating")}</th>
              <th>{t("admin.feedback.columns.comment")}</th>
              <th>{t("admin.feedback.columns.target")}</th>
              <th>{t("admin.columns.user")}</th>
              <th>{t("admin.columns.createdAt")}</th>
              <th className="text-end">{t("admin.columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.results.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <span className="flex items-center gap-1">
                    <Star className="text-warning size-4 fill-current" />
                    {entry.rating}
                  </span>
                </td>
                <td className="max-w-md">
                  {entry.comment ? (
                    <p className="line-clamp-3 whitespace-pre-line">{entry.comment}</p>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm shrink-0 whitespace-nowrap">
                    {entry.target_type}
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs" title={entry.user_id}>
                    {entry.user_id.slice(0, 8)}…
                  </span>
                </td>
                <td>{formatDate(entry.created_at)}</td>
                <td>
                  <div className="flex justify-end">
                    <Tooltip content={t("admin.feedback.viewDetails")}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={() => openView(entry)}
                        aria-label={t("admin.feedback.viewDetails")}
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
      <FeedbackDetailModal ref={dialogRef} entry={viewing} />
    </>
  );
}

function FeedbackDetailModal({
  ref,
  entry,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  entry: AdminFeedbackEntry | null;
}) {
  const { t } = useTranslation();

  return (
    <BaseModal ref={ref} title={t("admin.feedback.detailsTitle")}>
      {entry && (
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <span className="text-base-content/60 text-xs">
              {t("admin.feedback.columns.comment")}
            </span>
            <p className="mt-1 whitespace-pre-line">
              {entry.comment || t("admin.feedback.noComment")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.feedback.columns.rating")}
              </span>
              <p className="flex items-center gap-1">
                <Star className="text-warning size-4 fill-current" />
                {entry.rating}
              </p>
            </div>
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.feedback.columns.target")}
              </span>
              <p>
                <span className="badge badge-ghost badge-sm shrink-0 whitespace-nowrap">
                  {entry.target_type}
                </span>
              </p>
            </div>
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.columns.user")}
              </span>
              <p className="font-mono">{entry.user_id}</p>
            </div>
            <div>
              <span className="text-base-content/60 text-xs">
                {t("admin.columns.createdAt")}
              </span>
              <p>{formatDate(entry.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
