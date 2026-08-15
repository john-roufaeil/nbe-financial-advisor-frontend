import { useParams } from "react-router";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { useAdminSessionRestore } from "@/lib/use-admin-session-restore";

/**
 * Admin-credential-space equivalent of use-session-gate.ts — shared state
 * for RequireAdmin's guard and AdminSignIn's own "already signed in, bounce
 * to the dashboard" check.
 */
export function useAdminSessionGate() {
  const status = useAdminSessionRestore();
  const hasSession = useAdminAuthStore(
    (s) => s.isAuthenticated && s.accessToken !== null,
  );
  const { lang } = useParams<{ lang: string }>();
  return { restoring: status === "restoring", hasSession, lang };
}
