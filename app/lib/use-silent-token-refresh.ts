import { useEffect } from "react";
import { isRefreshSessionInvalid, refreshAccessTokenOnce } from "@/api/client";
import {
  isAdminRefreshSessionInvalid,
  refreshAdminAccessTokenOnce,
} from "@/api/admin-client";
import { useAuthStore } from "@/store/use-auth-store";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";

const REFRESH_EARLY_MS = 60_000;
const TRANSIENT_RETRY_MS = 30_000;

function tokenExpiryMs(token: string): number | null {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(globalThis.atob(padded)) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : null;
  } catch {
    // Decoding is only a scheduling optimization. The backend remains the
    // authority, and the response interceptor still handles an eventual 401.
    return null;
  }
}

interface SilentRefreshOptions {
  isAuthenticated: boolean;
  accessToken: string | null;
  refresh: () => Promise<unknown>;
  isInvalidSession: (error: unknown) => boolean;
  expireSession: () => void;
}

/**
 * Refreshes a foreground session shortly before its access JWT expires.
 *
 * Hidden/offline tabs do not keep a session alive by themselves. When the tab
 * becomes visible or the browser reconnects, the expiry is checked immediately.
 * A transient network/server failure retries without logging the user out; only
 * an explicit refresh 401 ends the session.
 */
function useSilentTokenRefresh({
  isAuthenticated,
  accessToken,
  refresh,
  isInvalidSession,
  expireSession,
}: SilentRefreshOptions) {
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const token = accessToken;

    let cancelled = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function clearTimer() {
      if (timer) clearTimeout(timer);
      timer = null;
    }

    function canRefreshNow() {
      return document.visibilityState === "visible" && navigator.onLine;
    }

    function scheduleRetry() {
      if (cancelled || !canRefreshNow()) return;
      clearTimer();
      timer = setTimeout(() => void attemptRefresh(), TRANSIENT_RETRY_MS);
    }

    async function attemptRefresh() {
      if (cancelled || running || !canRefreshNow()) return;
      running = true;
      try {
        await refresh();
      } catch (error) {
        if (cancelled) return;
        if (isInvalidSession(error)) expireSession();
        else scheduleRetry();
      } finally {
        running = false;
      }
    }

    function scheduleFromExpiry() {
      clearTimer();
      const expiresAt = tokenExpiryMs(token);
      if (expiresAt === null) return;
      const delay = Math.max(0, expiresAt - Date.now() - REFRESH_EARLY_MS);
      timer = setTimeout(() => void attemptRefresh(), delay);
    }

    function resumeIfActive() {
      if (!canRefreshNow()) return;
      const expiresAt = tokenExpiryMs(token);
      if (expiresAt !== null && expiresAt - Date.now() <= REFRESH_EARLY_MS) {
        clearTimer();
        void attemptRefresh();
      } else {
        scheduleFromExpiry();
      }
    }

    scheduleFromExpiry();
    document.addEventListener("visibilitychange", resumeIfActive);
    window.addEventListener("online", resumeIfActive);

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", resumeIfActive);
      window.removeEventListener("online", resumeIfActive);
    };
  }, [accessToken, expireSession, isAuthenticated, isInvalidSession, refresh]);
}

function expireUserSession() {
  useAuthStore.getState().expireSession();
}

function expireAdminSession() {
  useAdminAuthStore.getState().logout();
}

export function useSilentSessionRefresh() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  useSilentTokenRefresh({
    isAuthenticated,
    accessToken,
    refresh: refreshAccessTokenOnce,
    isInvalidSession: isRefreshSessionInvalid,
    expireSession: expireUserSession,
  });
}

export function useSilentAdminSessionRefresh() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  useSilentTokenRefresh({
    isAuthenticated,
    accessToken,
    refresh: refreshAdminAccessTokenOnce,
    isInvalidSession: isAdminRefreshSessionInvalid,
    expireSession: expireAdminSession,
  });
}
