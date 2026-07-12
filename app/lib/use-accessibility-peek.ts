import { useEffect, useState } from "react";
import { PEEK_DURATION_MS } from "@/lib/constants/time";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

const PEEK_SEEN_STORAGE_KEY = STORAGE_KEYS.a11yPeekSeen;

/**
 * Reveals the collapsed accessibility-menu trigger once — the very first
 * time this browser ever visits the site — so a first-time user isn't left
 * guessing an invisible sliver is a button. Every later navigation leaves it
 * alone; keyboard users always get it via :focus-visible in app.css
 * regardless (a real Tab focus expands it on any page, not just the first).
 */
export function useAccessibilityPeek() {
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(PEEK_SEEN_STORAGE_KEY)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      localStorage.setItem(PEEK_SEEN_STORAGE_KEY, "1");
      return;
    }
    localStorage.setItem(PEEK_SEEN_STORAGE_KEY, "1");
    setPeeking(true);
    const timer = window.setTimeout(() => setPeeking(false), PEEK_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return peeking;
}
