import { Navigate, Outlet, useLocation } from "react-router";
import { useSessionGate } from "@/lib/use-session-gate";
import { RestoringScreen } from "@/components/shared/auth/RestoringScreen";

/**
 * Gate for every route behind the app shell.
 *
 * Guards on the ACCESS TOKEN, not on the persisted `isAuthenticated` flag
 * (see useSessionGate). Trusting the flag would admit the user, let the first
 * request fire without an Authorization header, and only bounce them once the
 * 401 interceptor ran — a visible flash of the dashboard followed by a logout.
 *
 * But a missing token is not a missing session: the httpOnly refresh cookie
 * survives the reload precisely so it can mint a new one. useSessionRestore does
 * that, and until it settles neither branch below is knowable — redirecting early
 * is what would sign a returning user out on every refresh.
 *
 * Onboarding is deliberately NOT behind this gate: signup stores tokens without
 * flipping `isAuthenticated`, so a half-onboarded user must stay put.
 */
export function RequireAuth() {
  const { restoring, hasSession, lang } = useSessionGate();
  const location = useLocation();

  if (restoring) return <RestoringScreen />;

  if (!hasSession) {
    // `from` lets sign-in send the user back where they were headed.
    return <Navigate to={`/${lang}/sign-in`} state={{ from: location }} replace />;
  }
  return <Outlet />;
}
