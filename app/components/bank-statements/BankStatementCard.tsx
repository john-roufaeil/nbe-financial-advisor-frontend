import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BankStatement } from "@/types/bank-statement";
import { formatDateTime } from "@/lib/format";
import type { TimeFormat } from "@/store/use-time-format-store";
import type { DateFormat } from "@/store/use-date-format-store";
import { BankBadge } from "@/components/shared/BankBadge";
import { useDeleteBankStatement } from "@/queries/bank-statements";
import { Tooltip } from "@/components/shared/Tooltip";
import { useConfirmStore } from "@/store/use-confirm-store";
import { useTimeFormatStore } from "@/store/use-time-format-store";
import { useDateFormatStore } from "@/store/use-date-format-store";
import { useDensityStore } from "@/store/use-density-store";
import type { ViewMode } from "@/store/use-view-mode-store";
import { BankStatementStatusBadge } from "@/components/bank-statements/BankStatementStatusBadge";

/** Bank name + logo are shown by BankBadge itself; the subtitle is just date + count. */
function bankStatementSubtitle(
  doc: BankStatement,
  t: (key: string, options?: Record<string, unknown>) => string,
  timeFormat: TimeFormat,
  dateFormat: DateFormat,
) {
  const parts = [formatDateTime(doc.uploadDate, timeFormat, t, dateFormat)];
  if (doc.extractedTransactions) {
    parts.push(
      t("bankStatements.detail.transactionCount", {
        count: doc.extractedTransactions.length,
      }),
    );
  }
  return parts.join(" · ");
}

export function BankStatementCard({
  doc,
  view,
  onOpen,
}: {
  doc: BankStatement;
  view: ViewMode;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const deleteBankStatement = useDeleteBankStatement();
  const confirm = useConfirmStore((s) => s.confirm);
  const timeFormat = useTimeFormatStore((s) => s.format);
  const dateFormat = useDateFormatStore((s) => s.format);
  const density = useDensityStore((s) => s.density);
  const isCompact = density === "compact";
  const isGrid = view === "grid";

  const logoAndText = (
    <BankBadge
      bank={doc.bankName}
      className="flex-1"
      subtitle={
        isCompact ? undefined : bankStatementSubtitle(doc, t, timeFormat, dateFormat)
      }
    />
  );

  const status = <BankStatementStatusBadge doc={doc} />;

  const deleteLabel = t("actions.delete", {
    name: doc.name || t("bankStatements.fallbackName"),
  });

  const deleteButton = (
    <Tooltip content={deleteLabel} className="shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          confirm({
            title: t("confirm.deleteBankStatementTitle"),
            message: t("confirm.deleteMessage"),
            onConfirm: () => deleteBankStatement.mutate(doc.id),
          });
        }}
        className="btn btn-ghost btn-sm btn-square text-error"
        aria-label={deleteLabel}
      >
        <Trash2 className="size-4" />
      </button>
    </Tooltip>
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLLIElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  }

  if (isGrid) {
    return (
      <li
        onClick={onOpen}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="button"
        className={`border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer flex-col rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isCompact ? "gap-2 p-2" : "gap-3 p-3"}`}
      >
        {logoAndText}
        <div className="border-base-200 flex items-center gap-2 border-t pt-2">
          {status}
          <div className="ms-auto">{deleteButton}</div>
        </div>
      </li>
    );
  }

  return (
    <li
      onClick={onOpen}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      className={`border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer items-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isCompact ? "gap-2 p-2" : "gap-3 p-3"}`}
    >
      {logoAndText}
      {status}
      {deleteButton}
    </li>
  );
}
