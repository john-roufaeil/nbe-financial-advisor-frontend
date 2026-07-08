import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  message?: string;
  onConfirm: () => void;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  confirm: (options: ConfirmOptions) => void;
  close: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  title: "",
  message: undefined,
  onConfirm: () => {},
  confirm: (options) => set({ isOpen: true, ...options }),
  close: () => set({ isOpen: false }),
}));
