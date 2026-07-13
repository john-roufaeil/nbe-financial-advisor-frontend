import { create } from "zustand";
import type { SupportedLanguage } from "@/i18n";

interface LanguageSwitchState {
  /** The language a switch is in flight toward, or null when idle. Cleared
   * once the route actually reflects it — not right after `navigate()`
   * returns, since that call resolves long before the new route renders. */
  pendingLang: SupportedLanguage | null;
  /** Toast text to show once the switch above actually lands — queued
   * instead of shown immediately so it appears after the page has switched,
   * not while the old one is still on screen. */
  pendingToast: string | null;
  setPendingLang: (lang: SupportedLanguage | null) => void;
  setPendingToast: (message: string | null) => void;
}

/**
 * Tracks an in-flight language switch, shared across every toggle instance
 * (sidebar, preferences menu, auth layout). Each toggle used to track this
 * in its own local `useState`, so clicking one didn't disable the others —
 * spamming two different toggles let their `switchTo` calls race each other
 * instead of queuing.
 */
export const useLanguageSwitchStore = create<LanguageSwitchState>()((set) => ({
  pendingLang: null,
  pendingToast: null,
  setPendingLang: (pendingLang) => set({ pendingLang }),
  setPendingToast: (pendingToast) => set({ pendingToast }),
}));
