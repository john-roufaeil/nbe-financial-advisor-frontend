# Future Enhancements

Frontend-side gaps that are intentionally unimplemented pending a product/backend decision — not bugs in existing behavior.

## Merge manual accounts into newly-connected bank accounts

**Status:** unhandled — no matching, merge, or dedup logic exists.

Connecting a bank account (`app/queries/bank-connections.ts`, `useConfirmBankConnection`) always creates a new `synced` account. It never checks the existing accounts list for a `manual` account that might represent the same real-world bank account.

- User manually tracks "NBE - Checking", later connects the real NBE account → two rows for the same account.
- Each duplicate derives its own balance independently, inflating net worth/balance figures on the dashboard.
- No warning or prompt appears anywhere in the connect-bank flow (`BankAccountsCard.tsx`'s `handleConnectBank`) to catch this before it happens.

**Open decision:**

- Backend support for merging (pass an existing manual account id into the connection-confirm step), or
- Client-side duplicate detection (match on bank name + currency) that prompts the user to resolve it, or
- Accept duplicates as normal and only offer a manual cleanup nudge.

## Merge manual account transaction history into the matching synced account instead of destroying it

**Status:** proposed — depends on the merge above being designed first.

Every transaction is pinned to one `account_id`, explicitly non-patchable (`app/api/transactions.ts`, `updateTransaction`). The only account-removal path (`useDeleteAccount` via `AccountDetailModal`'s "Remove" action) is generic and unconditional — deleting an account does not migrate its transactions, it orphans them.

- Once a manual/synced duplicate (above) is resolved by deleting the manual account, that account's transaction history is lost instead of carried onto the synced account.
- Historical spending/category data tied to those transactions disappears from any report built on transaction history, even though the intent was to consolidate, not erase.

**Open decision:**

- Bulk `account_id` reassignment as a new backend capability, or
- A softer consolidation strategy (e.g. archive instead of delete, keep transactions visible under a "closed account" state).
