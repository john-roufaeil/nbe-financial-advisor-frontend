import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DataSource = "mock" | "backend";

interface DataSourceState {
  source: DataSource;
  setSource: (source: DataSource) => void;
}

/** Client-only preference: which implementation queries/* hooks call — the in-memory mocks/* or the real api/*. */
export const useDataSourceStore = create<DataSourceState>()(
  persist(
    (set) => ({
      source: "mock",
      setSource: (source) => set({ source }),
    }),
    { name: "nbe_data_source" },
  ),
);
