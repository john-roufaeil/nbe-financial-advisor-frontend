import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

export type DataSource = "mock" | "backend";

interface DataSourceState {
  source: DataSource;
  setSource: (source: DataSource) => void;
}

/** Client-only preference: which implementation queries/* hooks call — the in-memory mocks/* or the real api/*. */
export const useDataSourceStore = create<DataSourceState>()(
  persist(
    (set) => ({
      source: "backend",
      setSource: (source) => set({ source }),
    }),
    { name: STORAGE_KEYS.dataSource, version: 1 },
  ),
);
