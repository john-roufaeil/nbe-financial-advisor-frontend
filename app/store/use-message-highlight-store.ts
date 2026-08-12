import { create } from "zustand";

/**
 * Tracks which chat message was just navigated to (e.g. via QuestionsNav),
 * so it can flash a highlight once it scrolls into view. `nonce` bumps on
 * every call, even re-selecting the same message, so the consumer can force
 * its highlight animation to restart instead of being a no-op re-render.
 */
interface MessageHighlightState {
  highlightedId: string | null;
  nonce: number;
  highlight: (id: string) => void;
}

export const useMessageHighlightStore = create<MessageHighlightState>((set) => ({
  highlightedId: null,
  nonce: 0,
  highlight: (id) => set((s) => ({ highlightedId: id, nonce: s.nonce + 1 })),
}));
