import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { mintSseTicket } from "@/api/events";
import { assistantMessageFromEvent, type RawReference, type RawWidget } from "@/api/chat";
import { useAuthStore } from "@/store/use-auth-store";
import { useChatStreamStore } from "@/store/use-chat-stream-store";
import { useToastStore } from "@/store/use-toast-store";
import { chatKeys, bumpConversationToFront, isAwaitingReply } from "@/queries/chat";
import { bankStatementKeys } from "@/queries/bank-statements";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import type { ChatMessage } from "@/types/chat";

/**
 * Exponential backoff (both for a failed ticket mint and for a dropped
 * stream), capped at 30s — a fixed short retry would hammer the backend at
 * a constant cadence for as long as a real outage lasts. Resets to the base
 * delay once `open` actually fires.
 */
const RECONNECT_BASE_DELAY_MS = 3000;
const RECONNECT_MAX_DELAY_MS = 30_000;

interface ChatTokenPayload {
  conversation_id: string;
  data: string;
}

interface ChatMessagePayload {
  conversation_id: string;
  id: string;
  content: string;
  widget: RawWidget | null;
  references: RawReference[] | null;
  suggestions: string[] | null;
}

interface ChatErrorPayload {
  conversation_id: string;
  message: string;
}

interface TransactionSyncedPayload {
  account_id: string;
}

interface AnomalyDetectedPayload {
  account_id: string;
}

function parseData<T>(event: MessageEvent<string>): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

function registerListeners(es: EventSource, queryClient: QueryClient) {
  es.addEventListener("chat_token", (e: MessageEvent<string>) => {
    const payload = parseData<ChatTokenPayload>(e);
    if (!payload) return;
    useChatStreamStore.getState().appendToken(payload.conversation_id, payload.data);
  });

  es.addEventListener("chat_message", (e: MessageEvent<string>) => {
    const payload = parseData<ChatMessagePayload>(e);
    if (!payload) return;
    useChatStreamStore.getState().clear(payload.conversation_id);
    // Builds the finished reply straight from this event's own payload
    // instead of invalidating .../messages to refetch what it already told
    // us (see assistantMessageFromEvent's docstring for why that's safe).
    // No-ops if this conversation was never fetched into the cache, and
    // dedupes in case the event is ever redelivered.
    const message = assistantMessageFromEvent(payload);
    queryClient.setQueryData<ChatMessage[]>(
      chatKeys.messages(payload.conversation_id),
      (old) => {
        if (!old || old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      },
    );
    bumpConversationToFront(queryClient, payload.conversation_id);
  });

  es.addEventListener("chat_error", (e: MessageEvent<string>) => {
    const payload = parseData<ChatErrorPayload>(e);
    if (!payload) return;
    useChatStreamStore.getState().clear(payload.conversation_id);
    useToastStore.getState().show(payload.message, "error");

    // Without this, isAwaitingReply (queries/chat.ts) has no way to learn the
    // reply failed — chat_error touched no query data before, so the loading
    // indicator sat on the still-unanswered user message until the 45s
    // hasChatTimedOut fallback eventually caught it. Guarded on still being
    // awaited so a stray/late chat_error can't clobber an already-landed reply.
    queryClient.setQueryData<ChatMessage[]>(
      chatKeys.messages(payload.conversation_id),
      (old) => {
        if (!old || !isAwaitingReply(old)) return old;
        const errorMessage: ChatMessage = {
          id: `error-${payload.conversation_id}-${Date.now()}`,
          role: "assistant",
          text: payload.message,
          createdAt: Date.now(),
          stage: "complete",
        };
        const last = old[old.length - 1];
        return last.role === "assistant"
          ? [...old.slice(0, -1), errorMessage]
          : [...old, errorMessage];
      },
    );
  });

  // No id/status fields are read here — the payload just tells us
  // *something* changed for a statement; useInvalidateAccountsOnProcessed
  // (queries/bank-statements.ts) already derives the processing -> processed
  // accounts nudge off the refetch this triggers, so there's no need to
  // duplicate that transition logic here.
  es.addEventListener("statement_status", () => {
    queryClient.invalidateQueries({ queryKey: bankStatementKeys.all });
  });

  es.addEventListener("transaction_synced", (e: MessageEvent<string>) => {
    const payload = parseData<TransactionSyncedPayload>(e);
    if (!payload) return;
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.transactions] });
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.accounts] });
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
  });

  es.addEventListener("anomaly_detected", (e: MessageEvent<string>) => {
    const payload = parseData<AnomalyDetectedPayload>(e);
    if (!payload) return;
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.anomalies] });
  });
}

/**
 * Owns the single multiplexed SSE connection (core/views/events.py's
 * EventStreamView) for the whole app — mounted once in AppLayout, not per
 * page, matching the backend's "one connection per user" model.
 *
 * The ticket minted by POST /events/ticket is single-use: the backend
 * expects the client to mint a fresh one and open a new EventSource on
 * error/close rather than rely on EventSource's native auto-reconnect,
 * which would just replay the already-consumed ticket and 401 forever. So
 * reconnection here is manual, gated on the native EventSource actually
 * having closed (readyState CLOSED) rather than firing on every transient
 * error while a native retry is still in flight.
 */
export function useEventStream() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    function scheduleReconnect(connect: () => void) {
      const delay = Math.min(
        RECONNECT_BASE_DELAY_MS * 2 ** attemptRef.current,
        RECONNECT_MAX_DELAY_MS,
      );
      attemptRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }

    async function connect() {
      let ticket: string;
      try {
        ({ ticket } = await mintSseTicket());
      } catch {
        if (!cancelled) scheduleReconnect(connect);
        return;
      }
      if (cancelled) return;

      const base = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
      const es = new EventSource(
        `${base}/events/stream/?ticket=${encodeURIComponent(ticket)}`,
      );
      esRef.current = es;
      registerListeners(es, queryClient);
      es.onopen = () => {
        attemptRef.current = 0;
      };
      es.onerror = () => {
        if (es.readyState !== EventSource.CLOSED) return;
        if (esRef.current === es) esRef.current = null;
        if (!cancelled) scheduleReconnect(connect);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [isAuthenticated, queryClient]);
}
