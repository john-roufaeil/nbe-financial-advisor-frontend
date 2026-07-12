import { Navigate, Outlet, useLocation, useParams } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";

/**
 * Gate for every route behind the app shell.
 *
 * Guards on the ACCESS TOKEN, not on the persisted `isAuthenticated` flag.
 * Tokens are deliberately in-memory only (XSS: see use-auth-store), so after a
 * full page reload the flag rehydrates as `true` while the token is gone.
 * Trusting the flag would admit the user, let the first request fire without an
 * Authorization header, and only bounce them once the 401 interceptor ran —
 * a visible flash of the dashboard followed by a logout. Requiring the token
 * redirects immediately and spends no request to learn what we already know.
 *
 * Onboarding is deliberately NOT behind this gate: signup stores tokens without
 * flipping `isAuthenticated`, so a half-onboarded user must stay put.
 */
export function RequireAuth() {
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  if (!hasSession) {
    // `from` lets sign-in send the user back where they were headed.
    return <Navigate to={`/${lang}/sign-in`} state={{ from: location }} replace />;
  }
  return <Outlet />;
}
