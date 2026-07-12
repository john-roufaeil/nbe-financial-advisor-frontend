import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { formatDateTime } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useAccounts } from "@/queries/accounts";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { BankBadge } from "@/components/shared/BankBadge";
import { Money } from "@/components/shared/Money";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-base-200 flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0">
      <span className="text-base-content/50 text-sm">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export const TransactionDetailModal = forwardRef<
  HTMLDialogElement,
  { transaction: Transaction | null }
>(function TransactionDetailModal({ transaction }, ref) {
  const { t } = useTranslation();
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const formatN = useNumberDisplay(true);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const account = accounts?.find((a) => a.id === transaction?.accountId);

  const isIncome = transaction?.type === "income";
  const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;

  return (
    <BaseModal
      ref={ref}
      icon={
        transaction && (
          <span
            data-no-flip
            className={`grid size-9 shrink-0 place-items-center rounded-full ${
              isIncome ? "bg-success/10 text-success" : "bg-error/10 text-error"
            }`}
          >
            <Icon data-no-flip className="size-5" />
          </span>
        )
      }
      title={transaction?.title || t("transactions.detail.title")}
    >
      {transaction && (
        <div className="flex flex-col">
          <DetailRow label={t("transactions.detail.amount")}>
            <Money className={isIncome ? "text-success" : "text-base-content"}>
              <span dir="ltr">
                {isIncome ? "+" : "-"}
                {formatN(transaction.amount)}
              </span>{" "}
              {t("currency.EGP")}
            </Money>
          </DetailRow>
          <DetailRow label={t("transactions.detail.category")}>
            {t(`common.categories.${transaction.category}`, transaction.category)}
          </DetailRow>
          <DetailRow label={t("transactions.detail.date")}>
            {formatDateTime(transaction.datetime, timeFormat, t, dateFormat)}
          </DetailRow>
          <DetailRow label={t("transactions.detail.type")}>
            {t(`common.filters.${transaction.type}`)}
          </DetailRow>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-base-content/50 text-sm">
              {t("transactions.detail.account")}
            </span>
            {accountsLoading ? (
              <Loader2 data-no-flip className="text-primary size-4 animate-spin" />
            ) : account ? (
              <BankBadge
                bank={account.bank_name}
                subtitle={<span dir="ltr">{account.masked_account_number}</span>}
                size="size-7"
                className="max-w-[65%] justify-end text-end"
              />
            ) : (
              <span className="text-base-content/50 text-sm">
                {t("transactions.detail.accountUnknown")}
              </span>
            )}
          </div>
        </div>
      )}
    </BaseModal>
  );
});
