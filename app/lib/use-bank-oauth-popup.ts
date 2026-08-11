import { useEffect, useRef } from "react";
import {
  openOAuthPopup,
  isBankOAuthResult,
  watchForUnhandledClose,
  type BankOAuthResult,
} from "@/lib/oauth-popup";
import { toastError } from "@/lib/toast";

/**
 * Shared orchestration for the two bank-OAuth popup flows (bank login on
 * sign-in, connect-a-bank on the accounts page) — deduped out of sign-in.tsx
 * and BankAccountsCard.tsx, which differed only in which endpoint supplies
 * `authorize_url`, any sessionStorage bookkeeping around it, and what to do
 * with a successful result (auth store vs. React Query cache invalidation).
 * Those stay the caller's responsibility; this hook owns opening the popup
 * (or falling back to a full-tab redirect if it was blocked), listening for
 * its result message, and watching for it closing without ever delivering
 * one.
 */
export function useBankOAuthPopup<K extends BankOAuthResult["kind"]>(
  kind: K,
  onSuccess: (result: Extract<BankOAuthResult, { kind: K; ok: true }>) => void,
) {
  // Set once handleMessage actually receives a result — lets the
  // popup-closed watcher below tell "closed after delivering its result"
  // apart from "closed without ever delivering one" (lost message, or the
  // user just closing it by hand).
  const handledRef = useRef(false);
  // Ref-indirection so the effect below doesn't need onSuccess in its
  // dependency array — it always reads the latest closure without the
  // listener itself being torn down and re-added every render.
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isBankOAuthResult(event) || event.data.kind !== kind) return;
      handledRef.current = true;
      if (event.data.ok) {
        onSuccessRef.current(
          event.data as Extract<BankOAuthResult, { kind: K; ok: true }>,
        );
      } else {
        toastError();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [kind]);

  /**
   * Opens the popup for `authorizeUrl` (or falls back to a full-tab redirect
   * if the browser blocked it) and starts watching for it to close without
   * ever handling a result.
   */
  function openPopup(authorizeUrl: string) {
    const popup = openOAuthPopup(authorizeUrl, kind);
    if (!popup) {
      window.location.href = authorizeUrl;
      return;
    }
    handledRef.current = false;
    watchForUnhandledClose(
      popup,
      () => handledRef.current,
      () => toastError(),
    );
  }

  return { openPopup };
}
