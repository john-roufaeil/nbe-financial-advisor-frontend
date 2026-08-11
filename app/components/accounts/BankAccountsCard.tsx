import { useRef } from "react";
import { CreditCard, Plus, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccounts } from "@/queries/accounts";
import { Tooltip } from "@/components/shared/Tooltip";
import { AddBankAccountModal } from "@/components/accounts/AddBankAccountModal";
import { AccountDetailModal } from "@/components/accounts/AccountDetailModal";
import { AccountRow } from "@/components/accounts/AccountRow";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { useConnectBank } from "@/lib/use-connect-bank";
import { useAccountDetailView } from "@/lib/use-account-detail-view";

export function BankAccountsCard() {
  const { t } = useTranslation();
  const { data: accounts, isPending, isError } = useAccounts();
  const addRef = useRef<HTMLDialogElement>(null);
  const { detailRef, viewedAccount, viewAccount } = useAccountDetailView();
  const { connectBank, isPending: connectPending } = useConnectBank();

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
    <div className="card border-base-300 bg-base-100 animate-entry min-w-0 border shadow-sm sm:col-span-2">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-success/10 text-success grid size-9 shrink-0 place-items-center rounded-lg">
            <CreditCard className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">
            {t("common.sections.accounts.title")}
          </h2>
          <Tooltip content={t("common.addAccount.connectBank")}>
            <button
              type="button"
              onClick={connectBank}
              disabled={connectPending}
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("common.addAccount.connectBank")}
            >
              <Landmark data-no-flip className="size-4" />
            </button>
          </Tooltip>
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
                onView={() => viewAccount(account)}
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
      <AccountDetailModal ref={detailRef} account={viewedAccount} />
    </div>
  );
}
