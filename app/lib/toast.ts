import { isAxiosError } from "axios";
import i18n from "@/i18n";
import { useToastStore } from "@/store/use-toast-store";

export function toastSuccess(key: string) {
  useToastStore.getState().show(i18n.t(key), "success");
}

export function toastError(key = "toast.genericError") {
  useToastStore.getState().show(i18n.t(key), "error");
}

export function toastApiError(error: unknown) {
  if (isAxiosError(error) && error.response?.data) {
    const data: unknown = error.response.data;

    if (data && typeof data === "object") {
      // Custom backend envelope: { error: { message: "..." } }
      const errorField = (data as Record<string, unknown>).error;
      if (
        errorField &&
        typeof errorField === "object" &&
        typeof (errorField as Record<string, unknown>).message === "string"
      ) {
        useToastStore
          .getState()
          .show((errorField as { message: string }).message, "error");
        return;
      }

      // DRF standard 'detail' key
      const detail = (data as Record<string, unknown>).detail;
      if (typeof detail === "string") {
        useToastStore.getState().show(detail, "error");
        return;
      }

      // DRF field validation errors (e.g., { email: ["Already exists"] })
      const firstKey = Object.keys(data)[0];
      const firstValue = firstKey
        ? (data as Record<string, unknown>)[firstKey]
        : undefined;
      if (firstKey && Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        const fieldName = firstKey.charAt(0).toUpperCase() + firstKey.slice(1);
        useToastStore.getState().show(`${fieldName}: ${firstValue[0]}`, "error");
        return;
      }
      if (firstKey && typeof firstValue === "string") {
        useToastStore.getState().show(firstValue, "error");
        return;
      }
    }
  }

  // Fallback to generic translation
  toastError();
}
