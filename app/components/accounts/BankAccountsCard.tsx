import { useRef, useState } from "react";
import { Pencil, Trash2, CreditCard, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccounts, useDeleteAccount } from "@/queries/accounts";
import { useConfirmStore } from "@/store/use-confirm-store";
import { BankBadge } from "@/components/shared/BankBadge";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { AddBankAccountModal } from "@/components/accounts/AddBankAccountModal";
import { EditBankAccountModal } from "@/components/accounts/EditBankAccountModal";
import type { BankAccount } from "@/types/account";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";

function AccountRow({
  account,
  onEdit,
  onDelete,
}: {
  account: BankAccount;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const currencyLabel = t(`currency.${account.currency}`, account.currency);

  return (
    <li className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-3">
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
        {Number(account.current_balance).toLocaleString()} {currencyLabel}
      </Money>
      <div className="flex shrink-0 gap-1">
        <Tooltip content={t("actions.edit")}>
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-ghost btn-sm btn-square"
            aria-label={t("actions.edit")}
          >
            <Pencil data-no-flip className="size-4" />
          </button>
        </Tooltip>
        <Tooltip content={t("actions.remove")}>
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-ghost btn-sm btn-square text-error"
            aria-label={t("actions.remove")}
          >
            <Trash2 data-no-flip className="size-4" />
          </button>
        </Tooltip>
      </div>
    </li>
  );
}

export function BankAccountsCard() {
  const { t } = useTranslation();
  const { data: accounts, isPending, isError } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const confirm = useConfirmStore((s) => s.confirm);
  const addRef = useRef<HTMLDialogElement>(null);
  const editRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  function openEdit(account: BankAccount) {
    setEditing(account);
    editRef.current?.showModal();
  }

  function confirmDelete(account: BankAccount) {
    confirm({
      title: t("confirm.deleteAccountTitle"),
      message: t("confirm.deleteMessage"),
      onConfirm: () => deleteAccount.mutate(account.id),
    });
  }

  if (isPending) {
    return (
      <CardSkeleton
        icon={CreditCard}
        className="animate-entry sm:col-span-2"
        rows={[{ kind: "progress" }, { kind: "progress" }]}
      />
    );
  }

  if (isError) {
    return (
      <div className="card border-base-300 bg-base-100 border shadow-sm sm:col-span-2">
        <div className="card-body p-4">
          <p className="text-error text-sm">{t("common.sections.accounts.error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm sm:col-span-2">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-success/10 text-success grid size-9 shrink-0 place-items-center rounded-lg">
            <CreditCard className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">
            {t("common.sections.accounts.title")}
          </h2>
          <Tooltip content={t("common.addAccount.add")}>
            <button
              type="button"
              onClick={() => addRef.current?.showModal()}
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("common.addAccount.add")}
            >
              <Plus data-no-flip className="size-4" />
            </button>
          </Tooltip>
        </div>

        {accounts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onEdit={() => openEdit(account)}
                onDelete={() => confirmDelete(account)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-base-content/50 text-sm">
            {t("common.sections.accounts.empty")}
          </p>
        )}
      </div>

      <AddBankAccountModal ref={addRef} />
      <EditBankAccountModal ref={editRef} account={editing} />
    </div>
  );
}
