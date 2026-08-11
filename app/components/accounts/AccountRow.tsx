import { RefreshCw, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BankAccount } from "@/types/account";
import { BankBadge } from "@/components/shared/BankBadge";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { useNumberDisplay } from "@/lib/use-number-display";

// `current_balance` is derived server-side from the account's latest transaction
// and is read-only, so there is no edit action here — only add and remove, the
// latter tucked into the details modal (AccountDetailModal) rather than this
// row. Synced accounts (link_type "synced") are entirely read-only server-side
// (assert_account_mutable() rejects edit/delete/manual transactions), so the
// modal shows a badge instead of a remove button for them rather than one
// that would 403.
export function AccountRow({
  account,
  onView,
}: {
  account: BankAccount;
  onView: () => void;
}) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const currencyLabel = t(`currency.${account.currency}`, account.currency);
  const isSynced = account.link_type === "synced";

  return (
    <li className="border-base-300 bg-base-100 flex min-w-0 items-center gap-3 rounded-lg border p-3">
      <BankBadge
        bank={account.bank_name}
        className="flex-1"
        subtitle={
          <>
            <span dir="ltr">{account.masked_account_number}</span>
            {account.account_type
              ? ` · ${t(`common.addAccount.accountTypes.${account.account_type}`, account.account_type)}`
              : ""}
            {account.is_active ? "" : ` · ${t("common.sections.accounts.inactive")}`}
          </>
        }
      />
      <Money className="shrink-0 text-sm font-semibold tabular-nums">
        {formatN(Number(account.current_balance))} {currencyLabel}
      </Money>
      <div className="flex shrink-0 items-center gap-1">
        {isSynced && (
          <Tooltip content={t("common.sections.accounts.syncedTooltip")}>
            <span className="badge badge-ghost gap-1 text-xs">
              <RefreshCw data-no-flip className="size-3" />
              {t("common.sections.accounts.synced")}
            </span>
          </Tooltip>
        )}
        <Tooltip content={t("common.sections.accounts.detail.title")}>
          <button
            type="button"
            onClick={onView}
            className="btn btn-ghost btn-sm btn-square"
            aria-label={t("common.sections.accounts.detail.title")}
          >
            <Info data-no-flip className="size-4" />
          </button>
        </Tooltip>
      </div>
    </li>
  );
}
