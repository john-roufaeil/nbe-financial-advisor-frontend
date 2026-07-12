import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { ACCESSIBILITY_LIMITS } from "@/lib/constants/accessibility";

const { MIN_SCALE, MAX_SCALE, SCALE_STEP, DEFAULT_SCALE } = ACCESSIBILITY_LIMITS;

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
    { name: STORAGE_KEYS.accessibility },
  ),
);
