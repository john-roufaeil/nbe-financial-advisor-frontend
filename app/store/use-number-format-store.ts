import { create } from "zustand";
import { persist } from "zustand/middleware";

/** "comma" = 1,234.56 (thousands ",", decimal "."); "period" = 1.234,56 (thousands ".", decimal ","). */
export type NumberFormat = "comma" | "period";

interface NumberFormatState {
  format: NumberFormat;
  setFormat: (format: NumberFormat) => void;
}

/** Client-only preference: thousands/decimal separator style, used app-wide wherever a number or amount is rendered. */
export const useNumberFormatStore = create<NumberFormatState>()(
  persist(
    (set) => ({
      format: "comma",
      setFormat: (format) => set({ format }),
    }),
    { name: "nbe_number_format" },
  ),
);
