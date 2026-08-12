import { useParams } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";
import { useSessionRestore } from "@/lib/use-session-restore";

/**
 * Shared state for RequireAuth and RequireGuest route guards.
 *
 * - `hasSession` requires a valid `accessToken`. Tokens are kept in-memory
 *   (for XSS security), so `isAuthenticated` can briefly be true after a
 *   reload while the token is actually missing.
 * - Wait for `restoring` before trusting either value — the server may still
 *   be issuing a new token via the httpOnly refresh cookie.
 */
export function useSessionGate() {
  const status = useSessionRestore();
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const { lang } = useParams<{ lang: string }>();
  return { restoring: status === "restoring", hasSession, lang };
}
