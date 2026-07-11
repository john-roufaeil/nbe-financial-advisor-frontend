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
  // Backend error text is untranslated and shouldn't be shown verbatim in
  // a non-English locale. Known cases get a translated message; everything
  // else falls back to the generic translated error.
  if (isEmailTakenError(error)) {
    toastError("toast.emailTaken");
    return;
  }

  toastError();
}

/** Whether a failed signup call failed specifically because the email is already registered. */
export function isEmailTakenError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (error.response?.status === 409) return true;

  const data: unknown = error.response?.data;
  if (!data || typeof data !== "object") return false;
  // DRF field validation errors key the response by field name (e.g. { email: [...] }).
  if ("email" in data) return true;

  const record = data as Record<string, unknown>;
  const errorField = record.error;
  let message = "";
  if (typeof record.detail === "string") {
    message = record.detail;
  } else if (
    errorField &&
    typeof errorField === "object" &&
    typeof (errorField as Record<string, unknown>).message === "string"
  ) {
    message = (errorField as { message: string }).message;
  }
  return /email/i.test(message) && /(exist|taken|registered)/i.test(message);
}
