import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

interface PageSizeState {
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}

/** Client-only preference: rows per page for the data tables (transactions, bank statements). */
export const usePageSizeStore = create<PageSizeState>()(
  persist(
    (set) => ({
      pageSize: DEFAULT_PAGE_SIZE,
      setPageSize: (pageSize) => set({ pageSize }),
    }),
    { name: STORAGE_KEYS.pageSize },
  ),
);
