import { Navigate, Outlet, useParams } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";
import { useSessionRestore } from "@/lib/use-session-restore";

/**
 * Inverse of RequireAuth: keeps already-authenticated users off splash,
 * sign-in, and onboarding by bouncing them straight to the dashboard.
 *
 * Uses the same ACCESS TOKEN check as RequireAuth (not just the persisted
 * `isAuthenticated` flag) so it only fires once. Signup stores tokens
 * without flipping `isAuthenticated`, so a half-onboarded user never has
 * `hasSession === true` here and is left alone mid-flow.
 *
 * Also waits on useSessionRestore like RequireAuth does: a genuinely signed-in
 * user reloading directly on e.g. /sign-in has no in-memory access token yet
 * (tokens don't survive a reload — see use-auth-store), so without waiting for
 * the refresh round-trip to settle, `hasSession` reads false and they'd see
 * the guest page instead of being redirected to the dashboard.
 */
export function RequireGuest() {
  const status = useSessionRestore();
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const { lang } = useParams<{ lang: string }>();

  if (status === "restoring") {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (hasSession) {
    return <Navigate to={`/${lang}/dashboard`} replace />;
  }
  return <Outlet />;
}
