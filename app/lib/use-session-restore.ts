import { useEffect, useState } from "react";
import * as authApi from "@/api/auth";
import * as authMock from "@/mocks/auth";
import { useAuthStore } from "@/store/use-auth-store";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";

function impl(source: DataSource) {
  return source === "mock" ? authMock : authApi;
}

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
    impl(source)
      .refresh()
      .then(({ access_token }) => {
        if (!cancelled) useAuthStore.getState().setAccessToken(access_token);
      })
      .catch(() => {
        // No cookie, or it expired or was already used — the session is genuinely
        // over. Reset quietly: the user did not click logout, so there is nothing
        // to announce, and RequireAuth will send them to sign-in.
        if (!cancelled) useAuthStore.getState().clearStaleAuth();
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
