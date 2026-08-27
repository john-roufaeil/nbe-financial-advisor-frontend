import { useEffect, useState } from "react";
import {
  isAdminRefreshSessionInvalid,
  refreshAdminAccessTokenOnce,
} from "@/api/admin-client";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";

export type AdminSessionStatus = "restoring" | "settled";

const RESTORE_RETRY_BASE_MS = 2_000;
const RESTORE_RETRY_MAX_MS = 30_000;

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
    let running = false;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    // Routed through the same single-flight refreshPromise the admin
    // client's 401 interceptor uses (see api/admin-client.ts) rather than
    // firing an independent POST /admin/auth/refresh — two uncoordinated
    // callers presenting the same pre-rotation refresh cookie would
    // otherwise race (the loser gets a 401 for a token the winner already
    // rotated away), same bug the end-user flow's useSessionRestore avoids
    // the same way.
    function scheduleRetry() {
      if (cancelled || !navigator.onLine) return;
      const delay = Math.min(
        RESTORE_RETRY_BASE_MS * 2 ** retryAttempt,
        RESTORE_RETRY_MAX_MS,
      );
      retryAttempt += 1;
      retryTimer = setTimeout(() => void restore(), delay);
    }

    async function restore() {
      if (cancelled || running || !navigator.onLine) return;
      running = true;
      try {
        await refreshAdminAccessTokenOnce();
        if (!cancelled) setStatus("settled");
      } catch (error) {
        if (cancelled) return;
        if (isAdminRefreshSessionInvalid(error)) {
          useAdminAuthStore.getState().logout();
          setStatus("settled");
        } else {
          scheduleRetry();
        }
      } finally {
        running = false;
      }
    }

    function retryWhenOnline() {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      retryAttempt = 0;
      void restore();
    }

    void restore();
    window.addEventListener("online", retryWhenOnline);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("online", retryWhenOnline);
    };
  }, [needsRestore]);

  return status;
}
