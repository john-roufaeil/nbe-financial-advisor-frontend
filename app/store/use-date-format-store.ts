import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DateFormat = "dmy" | "mdy";

interface DateFormatState {
  format: DateFormat;
  setFormat: (format: DateFormat) => void;
}

/** Client-only preference: dd/mm/yyyy vs mm/dd/yyyy, used app-wide wherever a date is rendered. */
export const useDateFormatStore = create<DateFormatState>()(
  persist(
    (set) => ({
      format: "dmy",
      setFormat: (format) => set({ format }),
    }),
    { name: "nbe_date_format" },
  ),
);
