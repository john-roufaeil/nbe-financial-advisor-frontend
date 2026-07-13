import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/use-auth-store";

/**
 * Single axios instance for all backend calls. Auth endpoints (signup/login/refresh)
 * don't need a token and simply run through this with no Authorization header set.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Required so the browser sends/stores the httpOnly refresh-token cookie.
  withCredentials: true,
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

/**
 * POST /auth/refresh takes NO body: the refresh token is an httpOnly cookie the
 * browser attaches automatically (withCredentials above). It is never readable
 * by JS, so there is no "do we have a refresh token?" check we can make up front
 * — we just attempt the call, and a 401 means the session is genuinely over.
 */
async function refreshAccessToken(): Promise<string> {
  const res = await apiClient.post<{ access_token: string }>("/auth/refresh");
  const accessToken = res.data.access_token;
  useAuthStore.getState().setAccessToken(accessToken);
  return accessToken;
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
    } catch {
      // The refresh cookie is missing, expired, or already used — the session is
      // over. If the user was signed in, tell them why; otherwise reset quietly.
      if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().expireSession();
      } else {
        useAuthStore.getState().clearStaleAuth();
      }
      return Promise.reject(error);
    }
  },
);
