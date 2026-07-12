import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

/** "comma" = 1,234.56 (thousands ",", decimal "."); "period" = 1.234,56 (thousands ".", decimal ","). */
export type NumberFormat = "comma" | "period";
export type DateFormat = "dmy" | "mdy";
export type TimeFormat = "12h" | "24h";
export type Density = "comfortable" | "compact";
export type ViewMode = "list" | "grid";

interface DisplayPreferencesState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  density: Density;
  setDensity: (density: Density) => void;
  compactNumbers: boolean;
  setCompactNumbers: (compact: boolean) => void;
  numberFormat: NumberFormat;
  setNumberFormat: (format: NumberFormat) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  balanceHidden: boolean;
  toggleBalanceHidden: () => void;
}

const VIEW_MODES: readonly ViewMode[] = ["list", "grid"];
const DENSITIES: readonly Density[] = ["comfortable", "compact"];
const NUMBER_FORMATS: readonly NumberFormat[] = ["comma", "period"];
const DATE_FORMATS: readonly DateFormat[] = ["dmy", "mdy"];
const TIME_FORMATS: readonly TimeFormat[] = ["12h", "24h"];

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Every client-only display preference (view mode, density, number/date/time
 * formatting, balance visibility) in one persisted object under one storage
 * key, instead of a separate single-field store + storage key per toggle.
 */
export const useDisplayPreferencesStore = create<DisplayPreferencesState>()(
  persist(
    (set) => ({
      viewMode: "list",
      setViewMode: (viewMode) => set({ viewMode }),
      density: "comfortable",
      setDensity: (density) => set({ density }),
      compactNumbers: false,
      setCompactNumbers: (compactNumbers) => set({ compactNumbers }),
      numberFormat: "comma",
      setNumberFormat: (numberFormat) => set({ numberFormat }),
      dateFormat: "dmy",
      setDateFormat: (dateFormat) => set({ dateFormat }),
      timeFormat: "12h",
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      balanceHidden: false,
      toggleBalanceHidden: () => set((s) => ({ balanceHidden: !s.balanceHidden })),
    }),
    {
      name: STORAGE_KEYS.displayPreferences,
      // Guards against a corrupted/hand-edited/stale-shape localStorage value:
      // each field falls back to the freshly-created default instead of
      // letting an invalid value (e.g. `density: "foo"`) flow through to
      // narrowly-typed consumers untouched.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DisplayPreferencesState>;
        return {
          ...current,
          viewMode: isOneOf(p.viewMode, VIEW_MODES) ? p.viewMode : current.viewMode,
          density: isOneOf(p.density, DENSITIES) ? p.density : current.density,
          compactNumbers: isBoolean(p.compactNumbers)
            ? p.compactNumbers
            : current.compactNumbers,
          numberFormat: isOneOf(p.numberFormat, NUMBER_FORMATS)
            ? p.numberFormat
            : current.numberFormat,
          dateFormat: isOneOf(p.dateFormat, DATE_FORMATS)
            ? p.dateFormat
            : current.dateFormat,
          timeFormat: isOneOf(p.timeFormat, TIME_FORMATS)
            ? p.timeFormat
            : current.timeFormat,
          balanceHidden: isBoolean(p.balanceHidden)
            ? p.balanceHidden
            : current.balanceHidden,
        };
      },
    },
  ),
);
