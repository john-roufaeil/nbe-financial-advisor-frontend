import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ForwardedRef,
} from "react";
import type { Transaction } from "@/types/transaction";

export interface TransactionsTabHandle {
  openAdd: () => void;
}

/**
 * Owns the add/edit modal and the detail modal for the transactions tab,
 * including the imperative `openAdd` handle the parent route uses to open
 * the add modal from outside (e.g. a dashboard shortcut).
 *
 * Each modal is remounted (via its `key`) rather than just reopened, since
 * `AddTransactionModal`/`TransactionDetailModal` initialize their form state
 * from props only on mount. `null` means "no open pending" — a plain boolean
 * ref to skip the mount-effect run would break under StrictMode's dev-only
 * double-invoke (the ref flips on the first pass, so the duplicate pass
 * reopens the modal unconditionally); state doesn't have that problem.
 */
export function useTransactionModals(ref: ForwardedRef<TransactionsTabHandle>) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [modalKey, setModalKey] = useState<number | null>(null);

  const detailModalRef = useRef<HTMLDialogElement>(null);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [detailModalKey, setDetailModalKey] = useState<number | null>(null);

  useEffect(() => {
    if (modalKey === null) return;
    modalRef.current?.showModal();
  }, [modalKey]);

  useEffect(() => {
    if (detailModalKey === null) return;
    detailModalRef.current?.showModal();
  }, [detailModalKey]);

  useImperativeHandle(ref, () => ({
    openAdd: () => {
      setEditing(null);
      setModalKey((k) => (k ?? 0) + 1);
    },
  }));

  function openEdit(tr: Transaction) {
    setEditing(tr);
    setModalKey((k) => (k ?? 0) + 1);
  }

  function openDetail(tr: Transaction) {
    setViewing(tr);
    setDetailModalKey((k) => (k ?? 0) + 1);
  }

  return {
    modalRef,
    editing,
    modalKey,
    openEdit,
    detailModalRef,
    viewing,
    detailModalKey,
    openDetail,
  };
}
