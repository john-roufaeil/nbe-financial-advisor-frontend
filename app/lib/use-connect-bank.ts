import { useQueryClient } from "@tanstack/react-query";
import { useCreateBankConnection } from "@/queries/bank-connections";
import { useBankOAuthPopup } from "@/lib/use-bank-oauth-popup";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastSuccess } from "@/lib/toast";

/** Slug of the (currently only) registered bank connector — see services/bank_connectors/mock_bank.py on the backend. */
const MOCK_BANK_PROVIDER_SLUG = "mock_bank";

/**
 * Drives the "connect a bank" flow end to end: request a connection + its
 * authorize_url, stash the connection id for bank-connect-callback.tsx to
 * confirm against, then hand off to the shared OAuth popup. The confirm call
 * itself runs in the popup, in a separate React Query cache, so this tab's
 * own accounts/dashboard data needs its own invalidation once that's done.
 */
export function useConnectBank() {
  const createConnection = useCreateBankConnection();
  const queryClient = useQueryClient();

  const { openPopup } = useBankOAuthPopup("bank-connect", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.accounts] });
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
    queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
    toastSuccess("toast.bankConnected");
  });

  async function connectBank() {
    try {
      const { connection_id, authorize_url } = await createConnection.mutateAsync({
        provider_slug: MOCK_BANK_PROVIDER_SLUG,
      });
      sessionStorage.setItem(STORAGE_KEYS.pendingBankConnectionId, connection_id);
      // Falls back to a full-tab redirect if the popup was blocked — still
      // works via bank-connect-callback.tsx's no-opener branch, it just
      // navigates this tab away and back instead of staying on it.
      openPopup(authorize_url);
    } catch {
      // onError already toasted.
    }
  }

  return { connectBank, isPending: createConnection.isPending };
}
