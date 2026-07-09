import axios from "axios";
import { useAuthStore } from "@/store/use-auth-store";

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
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
