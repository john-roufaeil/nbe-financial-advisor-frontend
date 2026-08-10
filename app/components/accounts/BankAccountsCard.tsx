import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Plus, Landmark, RefreshCw, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccounts } from "@/queries/accounts";
import { BankBadge } from "@/components/shared/BankBadge";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { AddBankAccountModal } from "@/components/accounts/AddBankAccountModal";
import { AccountDetailModal } from "@/components/accounts/AccountDetailModal";
import type { BankAccount } from "@/types/account";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useCreateBankConnection } from "@/queries/bank-connections";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import {
  openOAuthPopup,
  isBankOAuthResult,
  watchForUnhandledClose,
} from "@/lib/oauth-popup";
import { toastSuccess, toastError } from "@/lib/toast";

/** Slug of the (currently only) registered bank connector — see services/bank_connectors/mock_bank.py on the backend. */
const MOCK_BANK_PROVIDER_SLUG = "mock_bank";

// `current_balance` is derived server-side from the account's latest transaction
// and is read-only, so there is no edit action here — only add and remove, the
// latter tucked into the details modal (AccountDetailModal) rather than this
// row. Synced accounts (link_type "synced") are entirely read-only server-side
// (assert_account_mutable() rejects edit/delete/manual transactions), so the
// modal shows a badge instead of a remove button for them rather than one
// that would 403.
function AccountRow({ account, onView }: { account: BankAccount; onView: () => void }) {
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

export function BankAccountsCard() {
  const { t } = useTranslation();
  const { data: accounts, isPending, isError } = useAccounts();
  const addRef = useRef<HTMLDialogElement>(null);
  const detailRef = useRef<HTMLDialogElement>(null);
  const [viewedAccount, setViewedAccount] = useState<BankAccount | null>(null);
  const createConnection = useCreateBankConnection();
  const queryClient = useQueryClient();
  // Set inside handleMessage once a result actually arrives — lets the
  // popup-closed watcher below tell "closed after delivering its result"
  // apart from "closed without ever delivering one" (lost message, or the
  // user just closing it by hand).
  const bankConnectHandledRef = useRef(false);

  // Listens for the popup opened by handleConnectBank (see lib/oauth-popup.ts)
  // to hand back its result — the confirm call itself runs in the popup, in a
  // separate React Query cache, so this tab's own accounts/dashboard data
  // needs its own invalidation once that's done.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isBankOAuthResult(event) || event.data.kind !== "bank-connect") return;
      bankConnectHandledRef.current = true;
      if (event.data.ok) {
        queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.accounts] });
        queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
        queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
        toastSuccess("toast.bankConnected");
      } else {
        toastError();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [queryClient]);

  function handleView(account: BankAccount) {
    setViewedAccount(account);
    detailRef.current?.showModal();
  }

  async function handleConnectBank() {
    try {
      const { connection_id, authorize_url } = await createConnection.mutateAsync({
        provider_slug: MOCK_BANK_PROVIDER_SLUG,
      });
      sessionStorage.setItem(STORAGE_KEYS.pendingBankConnectionId, connection_id);
      // Falls back to a full-tab redirect if the popup was blocked — still
      // works via bank-connect-callback.tsx's no-opener branch, it just
      // navigates this tab away and back instead of staying on it.
      const popup = openOAuthPopup(authorize_url, "bank-connect");
      if (!popup) {
        window.location.href = authorize_url;
        return;
      }
      bankConnectHandledRef.current = false;
      watchForUnhandledClose(
        popup,
        () => bankConnectHandledRef.current,
        () => toastError(),
      );
    } catch {
      // onError already toasted.
    }
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
              onClick={handleConnectBank}
              disabled={createConnection.isPending}
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
                onView={() => handleView(account)}
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
