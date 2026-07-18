import { Navigate, Outlet, useParams } from "react-router";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

/**
 * Gate for admin-only routes. Much simpler than RequireAuth: admin tokens have
 * no refresh flow, so there is no "restoring" state to wait on — either the
 * sessionStorage-persisted token exists or the admin must sign in again. An
 * expired token is caught by the admin client's 401 interceptor, which clears
 * the store and re-triggers this redirect.
 */
export default function RequireAdmin() {
  const { lang } = useParams<{ lang: string }>();
  const hasSession = useAdminAuthStore((s) => s.accessToken !== null);

  if (!hasSession) {
    return <Navigate to={localizedPath(lang!, ROUTE_SEGMENTS.admin)} replace />;
  }
  return <Outlet />;
}
