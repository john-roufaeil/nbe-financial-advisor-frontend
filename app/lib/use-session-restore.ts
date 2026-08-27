import { useEffect, useState } from "react";
import { isRefreshSessionInvalid, refreshAccessTokenOnce } from "@/api/client";
import { useAuthStore } from "@/store/use-auth-store";

export type SessionStatus = "restoring" | "settled";

const RESTORE_RETRY_BASE_MS = 2_000;
const RESTORE_RETRY_MAX_MS = 30_000;

/**
 * Recovers the in-memory access token after a full page reload.
 *
 * The token deliberately never touches localStorage (XSS: see use-auth-store),
 * so a reload always drops it while the persisted `isAuthenticated` flag survives.
 * That pair — flag set, token gone — is exactly the state the refresh cookie
 * exists to resolve: it is httpOnly, so it outlives the reload and JS cannot read
 * it, and POST /auth/refresh trades it for a fresh access token.
 *
 * Until that round-trip settles we know nothing, so callers must render neither
 * the app nor a redirect — hence "restoring" rather than a boolean.
 */
export function useSessionRestore(): SessionStatus {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Anyone already holding a token, and every anonymous visitor, is settled up
  // front: only the reloaded-session case has anything to wait for. Deriving the
  // initial value (rather than starting at "restoring") keeps the sign-in page
  // from flashing a spinner it never needed.
  const needsRestore = isAuthenticated && accessToken === null;
  const [status, setStatus] = useState<SessionStatus>(
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
    // Routed through the same single-flight refreshPromise the 401
    // interceptor uses (see api/client.ts) rather than firing an independent
    // POST /auth/refresh — two uncoordinated callers presenting the same
    // pre-rotation refresh cookie is exactly what caused the spurious
    // "silently signed out" bug (ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION
    // means the loser of that race gets a 401 for a token the winner already
    // rotated away, even with a perfectly healthy session).
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
        await refreshAccessTokenOnce();
        if (!cancelled) setStatus("settled");
      } catch (error) {
        if (cancelled) return;
        if (isRefreshSessionInvalid(error)) {
          // Only an explicit invalid-cookie response ends the session. A
          // timeout or temporary outage keeps restoring and retries instead
          // of incorrectly signing the user out.
          useAuthStore.getState().expireSession();
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
