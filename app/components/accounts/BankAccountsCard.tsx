import { useRef } from "react";
import { CreditCard, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccounts } from "@/queries/accounts";
import { Tooltip } from "@/components/shared/Tooltip";
import { SettingsGroup } from "@/components/shared/SettingsGroup";
import { AddBankAccountModal } from "@/components/accounts/AddBankAccountModal";
import { AccountDetailModal } from "@/components/accounts/AccountDetailModal";
import { AccountRow } from "@/components/accounts/AccountRow";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { useAccountDetailView } from "@/lib/use-account-detail-view";

export function BankAccountsCard() {
  const { t } = useTranslation();
  const { data: accounts, isPending, isError } = useAccounts();
  const addRef = useRef<HTMLDialogElement>(null);
  const { detailRef, viewedAccount, viewAccount } = useAccountDetailView();

  if (isPending) {
    return (
      <CardSkeleton
        bare
        icon={CreditCard}
        className="animate-entry"
        rows={[{ kind: "progress" }, { kind: "progress" }]}
      />
    );
  }

  if (isError) {
    return <p className="text-error text-sm">{t("common.sections.accounts.error")}</p>;
  }

  const action = (
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
  );

  return (
    <SettingsGroup title={t("common.sections.accounts.title")} action={action}>
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

      <AddBankAccountModal ref={addRef} />
      <AccountDetailModal ref={detailRef} account={viewedAccount} />
    </SettingsGroup>
  );
}
