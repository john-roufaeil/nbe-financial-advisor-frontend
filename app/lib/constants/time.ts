/** Millisecond durations for timers, animations, and debounces. */
export const TOAST_DURATION_MS = 3500;
export const RIPPLE_DURATION_MS = 500;
export const RIPPLE_CLEANUP_EXTRA_MS = 100;
export const PROCESSED_BADGE_DURATION_MS = 5000;
export const PROCESSED_BADGE_FADE_MS = 400;
export const DEBOUNCE_DELAY_MS = 300;
export const MOCK_LATENCY_MS = 400;
export const MOCK_CHAT_LATENCY_MS = 900;
export const QUERY_STALE_TIME_MS = 30_000;
// A real reply took ~8s in testing; generous headroom above that before
// treating a silent, no-reply-ever conversation as failed rather than just slow.
export const CHAT_REPLY_TIMEOUT_MS = 45_000;
