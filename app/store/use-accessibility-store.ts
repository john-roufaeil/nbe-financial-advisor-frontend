import { create } from "zustand";
import { persist } from "zustand/middleware";

const MIN_SCALE = 0.85;
const MAX_SCALE = 1.7;
const SCALE_STEP = 0.15;
const DEFAULT_SCALE = 1;

interface AccessibilityState {
  fontScale: number;
  highContrast: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontScale: (scale: number) => void;
  resetFontSize: () => void;
  toggleHighContrast: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      fontScale: DEFAULT_SCALE,
      highContrast: false,
      increaseFontSize: () =>
        set((s) => ({
          fontScale: Math.min(MAX_SCALE, +(s.fontScale + SCALE_STEP).toFixed(2)),
        })),
      decreaseFontSize: () =>
        set((s) => ({
          fontScale: Math.max(MIN_SCALE, +(s.fontScale - SCALE_STEP).toFixed(2)),
        })),
      setFontScale: (scale) =>
        set({ fontScale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, +scale.toFixed(2))) }),
      resetFontSize: () => set({ fontScale: DEFAULT_SCALE }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
    }),
    { name: "accessibility-settings" },
  ),
);

export const ACCESSIBILITY_LIMITS = { MIN_SCALE, MAX_SCALE, SCALE_STEP, DEFAULT_SCALE };
