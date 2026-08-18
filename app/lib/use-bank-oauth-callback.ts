import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";
import { useConfirmBankConnection } from "@/queries/bank-connections";
import { useBankLoginCallback } from "@/queries/auth";
import { useCheckProfileCompletion } from "@/queries/profile";
import { postOAuthResult, closePopupAfterResult } from "@/lib/oauth-popup";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { DEFAULT_LANGUAGE } from "@/i18n";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

/**
 * Fixed, unprefixed landing path both bank-OAuth flows share — the backend
 * hands the exact same `redirect_uri` (settings.MOCK_BANK_OAUTH_REDIRECT_URI
 * = ".../bank-connect/callback") to the connector whether this is a
 * passwordless bank login (POST /auth/bank-login/initiate/) or linking a
 * bank to an existing signed-in account (POST /bank-connections/) — there's
 * no `:lang` segment or query param to distinguish them at the URL level.
 *
 * The two are told apart by `pendingBankConnectionId` in sessionStorage:
 * only the "connect a bank" entry point (BankAccountsCard) sets it before
 * redirecting, since only that flow has a connection id to confirm against.
 * Its absence means this is a bank-login completing instead.
 *
 * Normally runs inside a popup (see lib/oauth-popup.ts) — the result is
 * handed back to the opener via postMessage and this window closes itself,
 * since a bank-login's access token has to land in the *opener* tab's
 * in-memory auth store (that's where the app is actually rendered). Falls
 * back to acting directly in this tab if there's no opener, e.g. a popup
 * blocker forced a full-tab redirect instead.
 *
 * The route always shows a spinner while this runs — every outcome here
 * navigates or closes the popup itself, so there's no "done" state to
 * return.
 */
export function useBankOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasSession = useAuthStore((s) => s.isAuthenticated && s.accessToken !== null);
  const login = useAuthStore((s) => s.login);
  const setTokens = useAuthStore((s) => s.setTokens);
  const confirmConnection = useConfirmBankConnection();
  const bankLoginCallback = useBankLoginCallback();
  const checkProfileCompletion = useCheckProfileCompletion();
  const submitted = useRef(false);

  // Forces this page out of the back/forward cache — some browsers can
  // otherwise resurrect a stale, already-run instance of this page (with its
  // own already-consumed sessionStorage read and closures) when the same
  // named popup window is reused for a later OAuth round trip, instead of a
  // genuinely fresh navigation. An empty `unload` listener is the standard
  // way to opt a page out of bfcache eligibility.
  useEffect(() => {
    const noop = () => {};
    window.addEventListener("unload", noop);
    return () => window.removeEventListener("unload", noop);
  }, []);

  useEffect(() => {
    if (submitted.current) return;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    // Read-and-clear immediately, not just once the connect-a-bank branch
    // below actually settles — otherwise an abandoned/interrupted connect
    // attempt (popup closed, tab navigated away, OTP never completed)
    // leaves this key stuck set, and the *next* callback landing (even a
    // completely unrelated bank-login) misreads it as "this is a
    // connect-a-bank confirmation" and calls the wrong endpoint with a
    // mismatched code/state.
    const connectionId = sessionStorage.getItem(STORAGE_KEYS.pendingBankConnectionId);
    sessionStorage.removeItem(STORAGE_KEYS.pendingBankConnectionId);
    const isPopup = !!window.opener;

    if (!code || !state) {
      if (isPopup) {
        postOAuthResult({
          kind: connectionId ? "bank-connect" : "bank-login",
          ok: false,
        });
        closePopupAfterResult();
      } else {
        navigate(localizedPath(DEFAULT_LANGUAGE, ROUTE_SEGMENTS.signIn), {
          replace: true,
        });
      }
      return;
    }
    submitted.current = true;

    if (connectionId) {
      // Connect-a-bank: requires an existing session (this is reached from
      // an authenticated screen), so a missing one here means it expired
      // mid-flow — bounce to sign-in same as any other stale session.
      if (!hasSession && !isPopup) {
        navigate(localizedPath(DEFAULT_LANGUAGE, ROUTE_SEGMENTS.signIn), {
          replace: true,
        });
        return;
      }
      confirmConnection
        .mutateAsync({ connectionId, body: { code, state } })
        .then(
          () => true,
          () => false,
        )
        .then((ok) => {
          if (isPopup) {
            postOAuthResult({ kind: "bank-connect", ok });
            closePopupAfterResult();
          } else {
            navigate(localizedPath(DEFAULT_LANGUAGE, ROUTE_SEGMENTS.profile), {
              replace: true,
            });
          }
        });
      return;
    }

    // Bank login: no connection id, no existing session required.
    bankLoginCallback
      .mutateAsync({ code, state })
      .then((tokens) => {
        if (isPopup) {
          postOAuthResult({
            kind: "bank-login",
            ok: true,
            accessToken: tokens.access_token,
          });
          closePopupAfterResult();
          return;
        }
        setTokens({ accessToken: tokens.access_token });
        login();
        void checkProfileCompletion();
        navigate(localizedPath(DEFAULT_LANGUAGE, ROUTE_SEGMENTS.dashboard), {
          replace: true,
        });
      })
      .catch(() => {
        if (isPopup) {
          postOAuthResult({ kind: "bank-login", ok: false });
          closePopupAfterResult();
        } else {
          navigate(localizedPath(DEFAULT_LANGUAGE, ROUTE_SEGMENTS.signIn), {
            replace: true,
          });
        }
      });
  }, [
    searchParams,
    hasSession,
    navigate,
    login,
    setTokens,
    confirmConnection,
    bankLoginCallback,
    checkProfileCompletion,
  ]);
}
