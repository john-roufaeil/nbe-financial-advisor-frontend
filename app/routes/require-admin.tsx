import { Navigate, Outlet } from "react-router";
import { useAdminSessionGate } from "@/lib/use-admin-session-gate";
import { RestoringScreen } from "@/components/shared/auth/RestoringScreen";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

/**
 * Gate for admin-only routes. Same shape as RequireAuth (core/views/auth.py's
 * end-user equivalent, app/components/shared/auth/RequireAuth.tsx) now that
 * POST /admin/auth/refresh exists (SEC-009): guards on the ACCESS TOKEN, not
 * the persisted `isAuthenticated` flag, and waits for useAdminSessionGate's
 * restore round-trip to settle before redirecting — a reload doesn't briefly
 * bounce a signed-in admin to sign-in just because the in-memory token hasn't
 * been restored from the httpOnly cookie yet.
 */
export default function RequireAdmin() {
  const { restoring, hasSession, lang } = useAdminSessionGate();

  if (restoring) return <RestoringScreen />;

  if (!hasSession) {
    return <Navigate to={localizedPath(lang!, ROUTE_SEGMENTS.admin)} replace />;
  }
  return <Outlet />;
}
