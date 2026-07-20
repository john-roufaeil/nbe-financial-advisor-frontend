import { useState } from "react";

/**
 * Best-effort guess at whether there's actually a previous page in this
 * tab's history to go back to — `window.history.length` is the only signal
 * the browser exposes for this (no direct "can go back" API). A link opened
 * directly (a new tab from an email client, a bookmark) starts at length 1,
 * so `back()` there would either no-op or leave the SPA entirely; disabling
 * the button in that case avoids a dead control. Read once on mount — this
 * is for landing pages that render once per page load, not a live-updating
 * value.
 */
export function useCanGoBack() {
  const [canGoBack] = useState(() => window.history.length > 1);
  return canGoBack;
}
