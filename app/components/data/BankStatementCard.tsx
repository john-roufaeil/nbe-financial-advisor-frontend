import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BankStatement } from "@/types/bank-statement";
import { formatDateTime } from "@/lib/format";
import type { TimeFormat } from "@/store/use-time-format-store";
import { BankBadge } from "@/components/shared/BankBadge";
import { useDeleteBankStatement } from "@/queries/bank-statements";
import { Tooltip } from "@/components/shared/Tooltip";
import { useConfirmStore } from "@/store/use-confirm-store";
import { useTimeFormatStore } from "@/store/use-time-format-store";
import type { ViewMode } from "@/store/use-view-mode-store";
import { BankStatementStatusBadge } from "@/components/data/BankStatementStatusBadge";

/** Bank name + logo are shown by BankBadge itself; the subtitle is just date + count. */
function bankStatementSubtitle(
  doc: BankStatement,
  t: (key: string, options?: Record<string, unknown>) => string,
  timeFormat: TimeFormat,
) {
  const parts = [formatDateTime(doc.uploadDate, timeFormat, t)];
  if (doc.extractedTransactions) {
    parts.push(
      t("data.bankStatementDetail.transactionCount", {
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
  const isGrid = view === "grid";

  const logoAndText = (
    <BankBadge
      bank={doc.bankName}
      className="flex-1"
      subtitle={bankStatementSubtitle(doc, t, timeFormat)}
    />
  );

  const status = <BankStatementStatusBadge doc={doc} />;

  const deleteLabel = t("actions.delete", {
    name: doc.name || t("data.bankStatementFallbackName"),
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
        className="border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer flex-col gap-3 rounded-md border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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
      className="border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {logoAndText}
      {status}
      {deleteButton}
    </li>
  );
}
