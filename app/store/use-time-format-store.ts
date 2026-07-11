import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimeFormat = "12h" | "24h";

interface TimeFormatState {
  format: TimeFormat;
  setFormat: (format: TimeFormat) => void;
}

/** Client-only preference: am/pm vs 24-hour clock, used app-wide wherever a time is rendered. */
export const useTimeFormatStore = create<TimeFormatState>()(
  persist(
    (set) => ({
      format: "12h",
      setFormat: (format) => set({ format }),
    }),
    { name: "nbe_time_format" },
  ),
);
