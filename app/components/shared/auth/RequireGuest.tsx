import { Navigate, Outlet } from "react-router";
import { useSessionGate } from "@/lib/use-session-gate";
import { RestoringScreen } from "@/components/shared/auth/RestoringScreen";

/**
 * Inverse of RequireAuth: bounces already-authenticated users off splash,
 * sign-in, and onboarding to the dashboard. Same token check and same wait
 * on session restore as RequireAuth, so a reload doesn't briefly show the
 * guest page to a signed-in user.
 */
export function RequireGuest() {
  const { restoring, hasSession, lang } = useSessionGate();

  if (restoring) return <RestoringScreen />;

  if (hasSession) {
    return <Navigate to={`/${lang}/dashboard`} replace />;
  }
  return <Outlet />;
}
