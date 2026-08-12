import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";

interface RawSseTicket {
  ticket: string;
  expires_in: number;
}

export interface SseTicket {
  ticket: string;
  expiresIn: number;
}

/**
 * POST /events/ticket — normal JWT-authenticated (goes through apiClient's
 * Bearer header like any other call). Mints a short-TTL, single-use ticket
 * for opening GET /events/stream with: a native EventSource can't set an
 * Authorization header, so the stream authenticates via this ticket instead
 * (see use-event-stream.ts).
 */
export async function mintSseTicket(): Promise<SseTicket> {
  const res = await apiClient.post<RawSseTicket>(API_ENDPOINTS.eventsTicket);
  return { ticket: res.data.ticket, expiresIn: res.data.expires_in };
}
