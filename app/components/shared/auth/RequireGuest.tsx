import { Navigate, Outlet } from "react-router";
import { useSessionGate } from "@/lib/use-session-gate";
import { RestoringScreen } from "@/components/shared/auth/RestoringScreen";

/**
 * Inverse of RequireAuth: keeps already-authenticated users off splash,
 * sign-in, and onboarding by bouncing them straight to the dashboard.
 *
 * Uses the same ACCESS TOKEN check as RequireAuth (via useSessionGate) so it
 * only fires once. Signup stores tokens without flipping `isAuthenticated`,
 * so a half-onboarded user never has `hasSession === true` here and is left
 * alone mid-flow.
 *
 * Also waits on session restore like RequireAuth does: a genuinely signed-in
 * user reloading directly on e.g. /sign-in has no in-memory access token yet
 * (tokens don't survive a reload — see use-auth-store), so without waiting for
 * the refresh round-trip to settle, `hasSession` reads false and they'd see
 * the guest page instead of being redirected to the dashboard.
 */
export function RequireGuest() {
  const { restoring, hasSession, lang } = useSessionGate();

  if (restoring) return <RestoringScreen />;

  if (hasSession) {
    return <Navigate to={`/${lang}/dashboard`} replace />;
  }
  return <Outlet />;
}
