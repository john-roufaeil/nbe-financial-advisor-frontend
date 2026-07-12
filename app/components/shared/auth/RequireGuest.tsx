import { Navigate, Outlet, useParams } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";

/**
 * Inverse of RequireAuth: keeps already-authenticated users off splash,
 * sign-in, and onboarding by bouncing them straight to the dashboard.
 *
 * Uses the same ACCESS TOKEN check as RequireAuth (not just the persisted
 * `isAuthenticated` flag) so it only fires once. Signup stores tokens
 * without flipping `isAuthenticated`, so a half-onboarded user never has
 * `hasSession === true` here and is left alone mid-flow.
 */
export function RequireGuest() {
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const { lang } = useParams<{ lang: string }>();

  if (hasSession) {
    return <Navigate to={`/${lang}/dashboard`} replace />;
  }
  return <Outlet />;
}
