import { useEffect, useState } from "react";
import { refreshAdminAccessTokenOnce } from "@/api/admin-client";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";

export type AdminSessionStatus = "restoring" | "settled";

/**
 * Admin-credential-space equivalent of use-session-restore.ts — recovers
 * the in-memory admin access token after a full page reload, added to
 * close SEC-009 (the admin token used to be persisted to sessionStorage
 * specifically because there was no refresh flow to restore it from
 * otherwise; see use-admin-auth-store.ts).
 *
 * The token deliberately never touches storage (XSS), so a reload always
 * drops it while the persisted `isAuthenticated` flag survives. That pair —
 * flag set, token gone — is exactly the state the admin_refresh_token
 * httpOnly cookie exists to resolve: it outlives the reload and JS cannot
 * read it, and POST /admin/auth/refresh trades it for a fresh access token.
 */
export function useAdminSessionRestore(): AdminSessionStatus {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const accessToken = useAdminAuthStore((s) => s.accessToken);

  const needsRestore = isAuthenticated && accessToken === null;
  const [status, setStatus] = useState<AdminSessionStatus>(
    needsRestore ? "restoring" : "settled",
  );

  useEffect(() => {
    if (!needsRestore) {
      setStatus("settled");
      return;
    }

    let cancelled = false;
    // Routed through the same single-flight refreshPromise the admin
    // client's 401 interceptor uses (see api/admin-client.ts) rather than
    // firing an independent POST /admin/auth/refresh — two uncoordinated
    // callers presenting the same pre-rotation refresh cookie would
    // otherwise race (the loser gets a 401 for a token the winner already
    // rotated away), same bug the end-user flow's useSessionRestore avoids
    // the same way.
    refreshAdminAccessTokenOnce()
      .catch(() => {
        // No cookie, or it expired or was already used — the session is
        // genuinely over.
        if (!cancelled) useAdminAuthStore.getState().logout();
      })
      .finally(() => {
        if (!cancelled) setStatus("settled");
      });

    return () => {
      cancelled = true;
    };
  }, [needsRestore]);

  return status;
}
