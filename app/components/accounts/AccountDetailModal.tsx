import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Trash2 } from "lucide-react";
import type { BankAccount } from "@/types/account";
import { formatDate } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { useConfirmStore } from "@/store/use-confirm-store";
import { useDeleteAccount } from "@/queries/accounts";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { BankBadge } from "@/components/shared/BankBadge";
import { Money } from "@/components/shared/Money";
import { closeDialog } from "@/lib/close-dialog";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-base-200 flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0">
      <span className="text-base-content/50 text-sm">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export const AccountDetailModal = forwardRef<
  HTMLDialogElement,
  { account: BankAccount | null }
>(function AccountDetailModal({ account }, ref) {
  const { t } = useTranslation();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const formatN = useNumberDisplay(true);
  const confirm = useConfirmStore((s) => s.confirm);
  const deleteAccount = useDeleteAccount();
  const currencyLabel = account
    ? t(`currency.${account.currency}`, account.currency)
    : "";

  function handleRemove() {
    if (!account) return;
    confirm({
      title: t("confirm.deleteAccountTitle"),
      message: t("confirm.deleteMessage"),
      onConfirm: () => {
        deleteAccount.mutate(account.id, { onSuccess: () => closeDialog(ref) });
      },
    });
  }

  return (
    <BaseModal
      ref={ref}
      icon={
        account && (
          <span
            data-no-flip
            className="bg-success/10 text-success grid size-9 shrink-0 place-items-center rounded-full"
          >
            <CreditCard data-no-flip className="size-4.5" />
          </span>
        )
      }
      title={t("common.sections.accounts.detail.title")}
      actionsStart={
        account && account.link_type !== "synced" ? (
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-ghost btn-sm text-error gap-2"
          >
            <Trash2 data-no-flip className="size-4" />
            {t("common.sections.accounts.detail.remove")}
          </button>
        ) : undefined
      }
      actions={
        <button
          type="button"
          onClick={() => closeDialog(ref)}
          className="btn btn-ghost btn-sm"
        >
          {t("actions.close")}
        </button>
      }
    >
      {account && (
        <div className="flex flex-col gap-4">
          <BankBadge bank={account.bank_name} size="size-11" />
          <div className="flex flex-col">
            <DetailRow label={t("common.sections.accounts.detail.accountNumber")}>
              <span dir="ltr">{account.masked_account_number}</span>
            </DetailRow>
            {account.account_type && (
              <DetailRow label={t("common.sections.accounts.detail.accountType")}>
                {t(
                  `common.addAccount.accountTypes.${account.account_type}`,
                  account.account_type,
                )}
              </DetailRow>
            )}
            <DetailRow label={t("common.sections.accounts.detail.currency")}>
              {currencyLabel}
            </DetailRow>
            <DetailRow label={t("common.sections.accounts.detail.balance")}>
              <Money>
                {formatN(Number(account.current_balance))} {currencyLabel}
              </Money>
            </DetailRow>
            <DetailRow label={t("common.sections.accounts.detail.status")}>
              {account.is_active
                ? t("common.sections.accounts.active")
                : t("common.sections.accounts.inactive")}
            </DetailRow>
            <DetailRow label={t("common.sections.accounts.detail.linkType")}>
              {account.link_type === "synced"
                ? t("common.sections.accounts.synced")
                : t("common.sections.accounts.manual")}
            </DetailRow>
            {account.external_account_id && (
              <DetailRow label={t("common.sections.accounts.detail.externalAccountId")}>
                <span dir="ltr">{account.external_account_id}</span>
              </DetailRow>
            )}
            <DetailRow label={t("common.sections.accounts.detail.addedOn")}>
              {formatDate(account.created_at, dateFormat)}
            </DetailRow>
          </div>
        </div>
      )}
    </BaseModal>
  );
});
