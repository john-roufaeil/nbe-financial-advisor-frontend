import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  message?: string;
  onConfirm: () => void;
  /** Overrides the confirm button's label (default: "Delete") — e.g. "Log
   * out" for a non-deletion confirmation like logging out other devices. */
  confirmLabel?: string;
  /** "danger" (default, red button + warning icon) or "default" (primary
   * button) — most confirmations here are deletions, but not all. */
  tone?: "danger" | "default";
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
  confirmLabel: undefined,
  tone: "danger",
  confirm: (options) =>
    set({ isOpen: true, tone: "danger", confirmLabel: undefined, ...options }),
  close: () => set({ isOpen: false }),
}));
