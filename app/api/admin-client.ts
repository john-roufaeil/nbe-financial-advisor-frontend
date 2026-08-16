import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { API_ENDPOINTS } from "@/lib/constants/api";

/**
 * Separate axios instance for the admin API. It cannot share `apiClient`:
 * that instance attaches the END-USER access token and, on a 401, tries
 * POST /auth/refresh — both wrong here. Admin tokens are a completely
 * separate credential space with their own refresh/logout endpoints
 * (POST /admin/auth/refresh, POST /admin/auth/logout — SEC-009).
 */
export const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Required so the browser sends/stores the httpOnly admin_refresh_token cookie.
  withCredentials: true,
  timeout: 20_000,
});

adminApiClient.interceptors.request.use((config) => {
  // Same Django trailing-slash normalization as api/client.ts.
  if (config.url && !config.url.endsWith("/")) {
    if (config.url.includes("?")) {
      config.url = config.url.replace("?", "/?");
    } else {
      config.url += "/";
    }
  }

  const { accessToken } = useAdminAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Requests that must never trigger a refresh-on-401 loop (refresh itself, and
// login where a 401 just means "bad credentials").
const ADMIN_AUTH_ENDPOINTS = [
  API_ENDPOINTS.adminAuthRefresh,
  API_ENDPOINTS.adminAuthLogin,
];

function isAdminAuthEndpoint(url?: string) {
  return !!url && ADMIN_AUTH_ENDPOINTS.some((path) => url.includes(path));
}

// Shared by every caller that might race into a refresh (401 handler below and
// useAdminSessionRestore) so parallel callers reuse one request instead of each
// presenting the same pre-rotation refresh cookie — the backend blacklists an
// admin refresh token after first use (AdminRefreshView), same as the end-user
// flow, so a second racing request would otherwise get wrongly signed out.
let adminRefreshPromise: Promise<{
  accessToken: string;
  adminId: string;
  role: "reviewer" | "super_admin";
}> | null = null;

/**
 * POST /admin/auth/refresh takes NO body: the refresh token is an httpOnly
 * cookie the browser attaches automatically (withCredentials above). It is
 * never readable by JS, so there is no "do we have a refresh token?" check
 * we can make up front — we just attempt the call, and a 401 means the
 * session is genuinely over.
 */
async function refreshAdminAccessToken() {
  const res = await adminApiClient.post<{
    access_token: string;
    admin_id: string;
    role: "reviewer" | "super_admin";
  }>(API_ENDPOINTS.adminAuthRefresh);
  const session = {
    accessToken: res.data.access_token,
    adminId: res.data.admin_id,
    role: res.data.role,
  };
  useAdminAuthStore
    .getState()
    .setAccessToken(session.accessToken, session.adminId, session.role);
  return session;
}

/** Shared single-flight entry point — see adminRefreshPromise above. */
export function refreshAdminAccessTokenOnce() {
  adminRefreshPromise ??= refreshAdminAccessToken().finally(() => {
    adminRefreshPromise = null;
  });
  return adminRefreshPromise;
}

adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried ||
      isAdminAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      const { accessToken } = await refreshAdminAccessTokenOnce();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return adminApiClient(originalRequest);
    } catch {
      // The refresh cookie is missing, expired, or already used — the
      // session is over.
      useAdminAuthStore.getState().logout();
      return Promise.reject(error);
    }
  },
);
