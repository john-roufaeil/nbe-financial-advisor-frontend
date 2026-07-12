import { create } from "zustand";
import { TOAST_DURATION_MS } from "@/lib/constants/time";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

export { TOAST_DURATION_MS };

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  // Auto-dismiss timing lives in <ToastHost> so it can be paused while a toast is hovered.
  show: (message, variant = "success") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
