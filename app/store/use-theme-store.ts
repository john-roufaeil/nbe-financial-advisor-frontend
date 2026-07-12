import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = STORAGE_KEYS.theme;

export function setThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

/**
 * Swaps the palette. Where supported (Chromium/Safari), does it inside a View
 * Transition so the whole page crossfades old→new instead of every surface
 * hard-cutting to its new color at once. Browsers without the API (Firefox,
 * older Safari) just get the plain class swap, which still animates smoothly
 * via the `transition` rules already on html/body/.card/etc. in app.css.
 */
export function applyTheme(theme: Theme) {
  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    setThemeClass(theme);
    return;
  }
  document.startViewTransition(() => setThemeClass(theme));
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/** Client-only preference: light/dark surface palette, applied as a `dark` class on <html>. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Plain class swap, not applyTheme's view transition — this runs on
        // initial load where the class is already set by root.tsx's blocking
        // inline script, so there's nothing to crossfade from.
        if (state) setThemeClass(state.theme);
      },
    },
  ),
);
