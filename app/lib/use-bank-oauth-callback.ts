import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useAuthStore } from "@/store/use-auth-store";
import { useBankLoginCallback } from "@/queries/auth";
import { useCheckProfileCompletion } from "@/queries/profile";
import { postOAuthResult, closePopupAfterResult } from "@/lib/oauth-popup";
import { DEFAULT_LANGUAGE } from "@/i18n";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

/**
 * Fixed, unprefixed landing path for passwordless mock-bank sign-in. The
 * path keeps its registered `/bank-connect/callback` name for OAuth redirect
 * compatibility, but authenticated post-signup bank linking is intentionally
 * outside the demo scope.
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
  const login = useAuthStore((s) => s.login);
  const setTokens = useAuthStore((s) => s.setTokens);
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
    const isPopup = !!window.opener;

    if (!code || !state) {
      if (isPopup) {
        postOAuthResult({
          kind: "bank-login",
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
    navigate,
    login,
    setTokens,
    bankLoginCallback,
    checkProfileCompletion,
  ]);
}
