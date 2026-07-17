import axios, { type AxiosError } from "axios";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { API_ENDPOINTS } from "@/lib/constants/api";

/**
 * Separate axios instance for the admin API. It cannot share `apiClient`:
 * that instance attaches the END-USER access token and, on a 401, tries
 * POST /auth/refresh — both wrong here. Admin tokens are a separate
 * credential space with no refresh endpoint, so a 401 on any admin call
 * (other than login itself) simply means the session is over.
 */
export const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

adminApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // A 401 on login is just bad credentials; anywhere else the token has
    // expired (no admin refresh endpoint exists) — drop the session so the
    // route guard redirects to the admin sign-in page.
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.includes(API_ENDPOINTS.adminAuthLogin)) {
      useAdminAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
