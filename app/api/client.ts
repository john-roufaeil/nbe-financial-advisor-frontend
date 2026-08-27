import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/use-auth-store";
import { API_ENDPOINTS } from "@/lib/constants/api";

/**
 * Single axios instance for all backend calls. Auth endpoints (signup/login/refresh)
 * don't need a token and simply run through this with no Authorization header set.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Required so the browser sends/stores the httpOnly refresh-token cookie.
  withCredentials: true,
  // axios defaults to no timeout at all — a blocked/blackholed connection
  // (misconfigured host, dropped packets) then hangs forever with neither a
  // response nor a rejection, which callers can't distinguish from "still
  // loading". 20s bounds that so onError always eventually fires.
  timeout: 20_000,
});

// These endpoints establish/renew a session from credentials or the httpOnly
// refresh cookie. Sending a stale bearer token to them can make DRF reject the
// request before the public view runs.
const NO_BEARER_ENDPOINTS = ["/auth/refresh", "/auth/login", "/auth/signup"];

// Requests that must never trigger a refresh-on-401 loop. Logout remains here
// but not in NO_BEARER_ENDPOINTS because it requires a valid access token.
const NO_REFRESH_ENDPOINTS = [...NO_BEARER_ENDPOINTS, "/auth/logout"];

function matchesEndpoint(url: string | undefined, endpoints: string[]) {
  return !!url && endpoints.some((path) => url.includes(path));
}

apiClient.interceptors.request.use((config) => {
  // Automatically append trailing slashes to meet Django's strict URL requirements
  // without needing to hardcode slashes in every API client call.
  if (config.url && !config.url.endsWith("/")) {
    if (config.url.includes("?")) {
      config.url = config.url.replace("?", "/?");
    } else {
      config.url += "/";
    }
  }

  const { accessToken } = useAuthStore.getState();
  if (accessToken && !matchesEndpoint(config.url, NO_BEARER_ENDPOINTS)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Shared by every caller that might race into a refresh (401 handler below and
// useSessionRestore) so parallel callers reuse one request instead of each
// presenting the same pre-rotation cookie — the backend blacklists a refresh
// token after first use, so a second racing request would otherwise get wrongly signed out.
let refreshPromise: Promise<string> | null = null;

export function isRefreshSessionInvalid(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/**
 * POST /auth/refresh takes NO body: the refresh token is an httpOnly cookie the
 * browser attaches automatically (withCredentials above). It is never readable
 * by JS, so there is no "do we have a refresh token?" check we can make up front
 * — we just attempt the call, and a 401 means the session is genuinely over.
 */
async function requestRefreshedAccessToken(): Promise<string> {
  const res = await apiClient.post<{ access_token: string }>(API_ENDPOINTS.authRefresh);
  const accessToken = res.data.access_token;
  useAuthStore.getState().setAccessToken(accessToken);
  return accessToken;
}

async function refreshAccessToken(): Promise<string> {
  // Module-level single-flight covers one tab. Web Locks additionally
  // serialize refresh-cookie rotation across same-origin tabs so two tabs
  // cannot present the same one-time refresh token concurrently.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(
      "nbe-user-session-refresh",
      requestRefreshedAccessToken,
    );
  }
  return requestRefreshedAccessToken();
}

/** Shared single-flight entry point — see refreshPromise above. */
export function refreshAccessTokenOnce(): Promise<string> {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried ||
      matchesEndpoint(originalRequest.url, NO_REFRESH_ENDPOINTS)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      const accessToken = await refreshAccessTokenOnce();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Only an explicit 401 means the cookie session is over. Network errors,
      // timeouts, rate limits, and server outages must not sign the user out.
      if (isRefreshSessionInvalid(refreshError)) {
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().expireSession();
        } else {
          useAuthStore.getState().clearStaleAuth();
        }
      }
      return Promise.reject(refreshError);
    }
  },
);
