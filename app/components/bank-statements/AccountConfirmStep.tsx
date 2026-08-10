import { useTranslation } from "react-i18next";
import { Loader2, Check, Plus } from "lucide-react";
import type { BankAccount } from "@/types/account";
import { BankBadge } from "@/components/shared/BankBadge";

/** Step 1 of the statement review flow: confirm (or add) which bank account this statement belongs to. */
export function AccountConfirmStep({
  accounts,
  accountsLoading,
  selectedAccountId,
  onSelectAccount,
  onAddNewAccount,
}: {
  accounts: BankAccount[] | undefined;
  accountsLoading: boolean;
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  onAddNewAccount: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-base-content/50 text-xs">
          {t("bankStatements.detail.stepOf", { current: 1, total: 2 })}
        </p>
        <p className="text-sm font-medium">
          {t("bankStatements.detail.confirmAccountTitle")}
        </p>
        <p className="text-base-content/60 text-xs">
          {t("bankStatements.detail.confirmAccountSubtitle")}
        </p>
      </div>

      {accountsLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 data-no-flip className="text-primary size-6 animate-spin" />
        </div>
      ) : (
        accounts &&
        accounts.length > 0 && (
          <ul className="flex flex-col gap-2">
            {accounts.map((account) => {
              const selected = account.id === selectedAccountId;
              return (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => onSelectAccount(account.id)}
                    className={`border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-start shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${selected ? "border-primary ring-primary/30 ring-1" : ""}`}
                  >
                    <BankBadge
                      bank={account.bank_name}
                      subtitle={<span dir="ltr">{account.masked_account_number}</span>}
                      className="flex-1"
                    />
                    {selected && (
                      <Check data-no-flip className="text-primary size-4 shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}

      {!accountsLoading && accounts?.length === 0 && (
        <p className="text-base-content/50 py-2 text-sm">
          {t("bankStatements.detail.noAccountsYet")}
        </p>
      )}

      <button
        type="button"
        onClick={onAddNewAccount}
        className="btn btn-ghost btn-sm w-fit gap-2 self-start"
      >
        <Plus className="size-4" />
        {t("bankStatements.detail.addNewAccount")}
      </button>
    </div>
  );
}
