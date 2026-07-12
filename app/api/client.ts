import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/use-auth-store";
import { API_ENDPOINTS } from "@/lib/constants/api";

/**
 * Single axios instance for all backend calls. Auth endpoints (signup/login/refresh)
 * don't need a token and simply run through this with no Authorization header set.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

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
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Requests that must never trigger a refresh-on-401 loop (refresh itself, and
// login/signup where a 401 just means "bad credentials").
const AUTH_ENDPOINTS = ["/auth/refresh", "/auth/login", "/auth/signup", "/auth/logout"];

function isAuthEndpoint(url?: string) {
  return !!url && AUTH_ENDPOINTS.some((path) => url.includes(path));
}

// Single in-flight refresh shared by every request that races into a 401, so a
// burst of parallel calls doesn't fire multiple refresh requests.
let refreshPromise: Promise<string> | null = null;

class NoRefreshTokenError extends Error {}

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    // Nothing to refresh — e.g. a reload wiped the in-memory tokens. This isn't
    // a session expiring, it's a session that was never re-established.
    throw new NoRefreshTokenError();
  }
  const res = await apiClient.post<{ access_token: string; refresh_token: string }>(
    API_ENDPOINTS.authRefresh,
    { refresh_token: refreshToken },
  );
  const tokens = res.data;
  useAuthStore.getState().setTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });
  return tokens.access_token;
}

apiClient.interceptors.response.use(
  (response) => {
    // Every backend response is wrapped in a { data: ... } envelope
    // (API Design Guidelines §3). Unwrap it once here so each service reads the
    // inner payload directly (no per-service res.data.data). Responses without
    // the envelope (or non-object bodies) fall through untouched.
    // NOTE: for collection endpoints the sibling `pagination` object lives
    // alongside `data`; unwrapping to `data` drops it. No current service reads
    // pagination, but a paginated consumer must read it before this unwrap.
    const body = response.data;
    if (body && typeof body === "object" && "data" in body) {
      response.data = (body as { data: unknown }).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      if (refreshError instanceof NoRefreshTokenError) {
        // No session to lose in the first place — reset silently, no modal.
        useAuthStore.getState().clearStaleAuth();
      } else {
        // A real refresh attempt failed: the session was live and is now gone.
        // Flag it so a global "session expired" modal can prompt a re-login.
        useAuthStore.getState().expireSession();
      }
      return Promise.reject(error);
    }
  },
);
