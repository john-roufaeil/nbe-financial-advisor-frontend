import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BankStatement } from "@/types/bank-statement";
import { formatDateTime } from "@/lib/format";
import type { TimeFormat, DateFormat } from "@/store/use-display-preferences-store";
import { BankBadge } from "@/components/shared/BankBadge";
import { useDeleteBankStatement } from "@/queries/bank-statements";
import { Tooltip } from "@/components/shared/Tooltip";
import { useConfirmStore } from "@/store/use-confirm-store";
import {
  useDisplayPreferencesStore,
  type ViewMode,
} from "@/store/use-display-preferences-store";
import { BankStatementStatusBadge } from "@/components/bank-statements/BankStatementStatusBadge";
import { ClickableListItem } from "@/components/shared/ClickableListItem";

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
  selected,
  onToggleSelect,
}: {
  doc: BankStatement;
  view: ViewMode;
  onOpen: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const { t } = useTranslation();
  const deleteBankStatement = useDeleteBankStatement();
  const confirm = useConfirmStore((s) => s.confirm);
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const density = useDisplayPreferencesStore((s) => s.density);
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

  const statementName = doc.name || t("bankStatements.fallbackName");
  const deleteLabel = t("actions.delete", { name: statementName });
  const viewDetailsLabel = t("actions.viewDetails", { name: statementName });

  const checkbox = (
    <input
      type="checkbox"
      className="checkbox checkbox-sm relative z-10 shrink-0"
      checked={selected}
      onChange={onToggleSelect}
      onClick={(e) => e.stopPropagation()}
      aria-label={statementName}
    />
  );

  const deleteButton = (
    <Tooltip content={deleteLabel} className="relative z-10 shrink-0">
      <button
        type="button"
        onClick={() => {
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

  if (isGrid) {
    return (
      <ClickableListItem
        onActivate={onOpen}
        activateLabel={viewDetailsLabel}
        className={`border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer flex-col rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isCompact ? "gap-2 p-2" : "gap-3 p-3"}`}
      >
        <div className="flex items-center gap-3">
          {checkbox}
          {logoAndText}
        </div>
        <div className="border-base-200 flex items-center gap-2 border-t pt-2">
          {status}
          <div className="ms-auto">{deleteButton}</div>
        </div>
      </ClickableListItem>
    );
  }

  return (
    <ClickableListItem
      onActivate={onOpen}
      activateLabel={viewDetailsLabel}
      className={`border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer items-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isCompact ? "gap-2 p-2" : "gap-3 p-3"}`}
    >
      {checkbox}
      {logoAndText}
      {status}
      {deleteButton}
    </ClickableListItem>
  );
}
