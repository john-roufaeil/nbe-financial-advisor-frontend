import { Navigate, Outlet, useLocation } from "react-router";
import { useSessionGate } from "@/lib/use-session-gate";
import { useConsentStatus } from "@/queries/consent";
import { RestoringScreen } from "@/components/shared/auth/RestoringScreen";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

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
  // Declining/revoking terms_of_service restricts the account to profile-only
  // (account housekeeping — Preferences, Support, Account Management, and the
  // basic profile fields) until it's re-granted from there; every other route
  // bounces to profile instead of rendering. Purely a frontend UX restriction
  // — unlike data_processing, terms_of_service isn't enforced by the backend.
  const { isActive: hasAgreedToTerms, isPending: termsPending } =
    useConsentStatus("terms_of_service");

  if (restoring) return <RestoringScreen />;

  if (!hasSession) {
    // `from` lets sign-in send the user back where they were headed.
    return (
      <Navigate
        to={localizedPath(lang!, ROUTE_SEGMENTS.signIn)}
        state={{ from: location }}
        replace
      />
    );
  }

  const profilePath = localizedPath(lang!, ROUTE_SEGMENTS.profile);
  if (!termsPending && !hasAgreedToTerms && location.pathname !== profilePath) {
    return <Navigate to={profilePath} replace />;
  }

  return <Outlet />;
}
