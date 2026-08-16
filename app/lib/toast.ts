import { isAxiosError } from "axios";
import i18n from "@/i18n";
import { useToastStore } from "@/store/use-toast-store";

export function toastSuccess(key: string) {
  useToastStore.getState().show(i18n.t(key), "success");
}

export function toastError(key = "toast.genericError") {
  useToastStore.getState().show(i18n.t(key), "error");
}

const EMAIL_TAKEN_PATTERN = /email.*(exist|taken|registered)/i;

/**
 * Known backend error messages mapped to translated toast keys, so common
 * cases still render in the user's locale instead of raw English text.
 */
const KNOWN_ERROR_KEYS: { pattern: RegExp; key: string }[] = [
  { pattern: EMAIL_TAKEN_PATTERN, key: "toast.emailTaken" },
];

export function toastApiError(error: unknown) {
  if (isRateLimitError(error)) {
    const seconds = getRetryAfterSeconds(error);
    useToastStore
      .getState()
      .show(
        seconds
          ? i18n.t("toast.rateLimited", { seconds })
          : i18n.t("toast.rateLimitedGeneric"),
        "error",
      );
    return;
  }

  const message = extractApiErrorMessage(error);

  if (message) {
    const known = KNOWN_ERROR_KEYS.find(({ pattern }) => pattern.test(message));
    useToastStore.getState().show(known ? i18n.t(known.key) : message, "error");
    return;
  }

  toastError();
}

/** Whether a failed API call failed specifically because of rate limiting (SEC-004). */
export function isRateLimitError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 429;
}

/**
 * Seconds until the caller may retry, per the backend's `Retry-After` header
 * (DRF's Throttled exception sets this automatically). Undefined if the
 * header is missing or unparseable — callers should fall back to a generic
 * "try again shortly" message rather than assuming a specific wait.
 */
export function getRetryAfterSeconds(error: unknown): number | undefined {
  if (!isAxiosError(error)) return undefined;
  const header = error.response?.headers?.["retry-after"];
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/** Pulls a human-readable message out of a failed API call, if the backend sent one. */
export function extractApiErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;

  const data: unknown = error.response?.data;
  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;

  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;

  const errorField = record.error;
  if (typeof errorField === "string") return errorField;
  if (
    errorField &&
    typeof errorField === "object" &&
    typeof (errorField as Record<string, unknown>).message === "string"
  ) {
    return (errorField as { message: string }).message;
  }

  // DRF field validation errors key the response by field name, e.g. { email: ["..."] }.
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }

  return undefined;
}

/** Whether a failed signup call failed specifically because the email is already registered. */
export function isEmailTakenError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (error.response?.status === 409) return true;

  return EMAIL_TAKEN_PATTERN.test(extractApiErrorMessage(error) ?? "");
}
