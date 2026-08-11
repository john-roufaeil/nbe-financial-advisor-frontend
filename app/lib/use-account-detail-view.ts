import { useRef, useState } from "react";
import type { BankAccount } from "@/types/account";

/**
 * The account-detail-and-delete entry point: which account is currently
 * shown in AccountDetailModal (deletion itself is a "Remove" action inside
 * that modal, not here) and the ref to open it.
 */
export function useAccountDetailView() {
  const detailRef = useRef<HTMLDialogElement>(null);
  const [viewedAccount, setViewedAccount] = useState<BankAccount | null>(null);

  function viewAccount(account: BankAccount) {
    setViewedAccount(account);
    detailRef.current?.showModal();
  }

  return { detailRef, viewedAccount, viewAccount };
}
