import { useEffect, useState } from "react";
import * as authMock from "@/mocks/auth";
import { refreshAccessTokenOnce } from "@/api/client";
import { useAuthStore } from "@/store/use-auth-store";
import { useDataSourceStore } from "@/store/use-data-source-store";

export type SessionStatus = "restoring" | "settled";

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
  const source = useDataSourceStore((s) => s.source);
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
    // Real backend: routed through the same single-flight refreshPromise the
    // 401 interceptor uses (see api/client.ts) rather than firing an
    // independent POST /auth/refresh — two uncoordinated callers presenting
    // the same pre-rotation refresh cookie is exactly what caused the
    // spurious "silently signed out" bug (ROTATE_REFRESH_TOKENS +
    // BLACKLIST_AFTER_ROTATION means the loser of that race gets a 401 for a
    // token the winner already rotated away, even with a perfectly healthy
    // session). Mock source has no such backend, no rotation, no race.
    const restore =
      source === "mock"
        ? authMock.refresh().then(({ access_token }) => {
            useAuthStore.getState().setAccessToken(access_token);
          })
        : refreshAccessTokenOnce().then(() => {});

    restore
      .catch(() => {
        // No cookie, or it expired or was already used — the session is genuinely
        // over. `isAuthenticated` was true going into this (that's what made
        // needsRestore true), so this is a real, previously-live session ending,
        // not "there was never one" — expireSession() over clearStaleAuth() so
        // the SessionExpiredModal explains why RequireAuth is about to bounce
        // them to sign-in, instead of that redirect just happening silently.
        if (!cancelled) useAuthStore.getState().expireSession();
      })
      .finally(() => {
        if (!cancelled) setStatus("settled");
      });

    return () => {
      cancelled = true;
    };
  }, [needsRestore, source]);

  return status;
}
