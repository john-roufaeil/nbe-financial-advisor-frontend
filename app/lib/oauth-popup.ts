/**
 * Popup plumbing for mock-bank OAuth+OTP sign-in. A popup (rather than a
 * full-page redirect) keeps the app
 * mounted in the original tab, so its in-memory-only access token and React
 * Query cache survive — a full-tab redirect there and back would lose both.
 */

const POPUP_WIDTH = 480;
const POPUP_HEIGHT = 640;

/** Opens a centered popup window. Returns null if the browser blocked it (caller should fall back to a full-page redirect). */
export function openOAuthPopup(url: string, name: string): Window | null {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
  return window.open(
    url,
    name,
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`,
  );
}

export type BankOAuthResult =
  | { kind: "bank-login"; ok: true; accessToken: string }
  | { kind: "bank-login"; ok: false };

/** Called from inside the popup, once the provider has redirected back to it, to hand the result to the opener. */
export function postOAuthResult(result: BankOAuthResult) {
  window.opener?.postMessage(result, window.location.origin);
}

/**
 * Closes this popup shortly after posting its result — never synchronously
 * right after postMessage(). Some browsers haven't finished dispatching the
 * message to the opener by the time a same-tick window.close() tears the
 * window down, silently dropping it; a tick of slack avoids that race.
 */
export function closePopupAfterResult() {
  setTimeout(() => window.close(), 100);
}

/**
 * Polls a popup opened via openOAuthPopup and calls onUnhandledClose if it
 * closes without ever having delivered a result message — otherwise a
 * message lost to a browser quirk (or the user just closing the popup by
 * hand) leaves the opener stuck silently waiting forever instead of showing
 * an explicit error.
 */
export function watchForUnhandledClose(
  popup: Window,
  isHandled: () => boolean,
  onUnhandledClose: () => void,
) {
  const interval = setInterval(() => {
    if (popup.closed) {
      clearInterval(interval);
      if (!isHandled()) onUnhandledClose();
    }
  }, 500);
}

/** Type guard for the opener's `message` listener — also enforces the same-origin check every postMessage consumer must do. */
export function isBankOAuthResult(
  event: MessageEvent,
): event is MessageEvent<BankOAuthResult> {
  return (
    event.origin === window.location.origin &&
    !!event.data &&
    typeof event.data === "object" &&
    event.data.kind === "bank-login"
  );
}
