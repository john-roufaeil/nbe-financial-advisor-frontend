import { useEffect, useRef, useState } from "react";
import type { BankAccount } from "@/types/account";
import type { BankStatement } from "@/types/bank-statement";

/** Statements print account numbers with spaces or dashes; the stored value has
 * neither, so both sides are reduced to digits before comparing. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Matches on the whole number, not a trailing fragment: every account now
 * stores the real number regardless of origin (manual, statement, or synced
 * via the connector contract), so a partial match would only serve to
 * false-match two genuinely different accounts that happen to share digits.
 */
function findMatchingAccount(
  accounts: BankAccount[] | undefined,
  perceivedAccountNumber: string | undefined,
): BankAccount | undefined {
  if (!accounts || !perceivedAccountNumber) return undefined;
  const perceived = digitsOnly(perceivedAccountNumber);
  if (!perceived) return undefined;
  return accounts.find((a) => digitsOnly(a.account_number) === perceived);
}

/**
 * Step 1 (confirm bank account) selection state for the statement review flow:
 * resets whenever a different statement opens, pre-selects the account whose
 * number matches the perceived account number once per statement, and
 * auto-selects an account just created via the stacked "add new account" modal.
 */
export function useAccountPreselect(
  doc: BankStatement | undefined,
  accounts: BankAccount[] | undefined,
) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [awaitingNewAccount, setAwaitingNewAccount] = useState(false);

  useEffect(() => {
    setSelectedAccountId(null);
    setAwaitingNewAccount(false);
  }, [doc?.id]);

  const matchedStatementIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!doc || !accounts || matchedStatementIdRef.current === doc.id) return;
    matchedStatementIdRef.current = doc.id;
    const match = findMatchingAccount(accounts, doc.perceivedAccountNumber);
    if (match) setSelectedAccountId(match.id);
  }, [doc, accounts]);

  useEffect(() => {
    if (!awaitingNewAccount || !accounts || accounts.length === 0) return;
    const newest = [...accounts].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )[0];
    setSelectedAccountId(newest.id);
    setAwaitingNewAccount(false);
  }, [accounts, awaitingNewAccount]);

  return { selectedAccountId, setSelectedAccountId, setAwaitingNewAccount };
}
