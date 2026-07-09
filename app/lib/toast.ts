import i18n from "@/i18n";
import { useToastStore } from "@/store/use-toast-store";

export function toastSuccess(key: string) {
  useToastStore.getState().show(i18n.t(key), "success");
}

export function toastError(key = "toast.genericError") {
  useToastStore.getState().show(i18n.t(key), "error");
}
