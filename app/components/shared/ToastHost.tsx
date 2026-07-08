import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import {
  useToastStore,
  TOAST_DURATION_MS,
  type Toast,
  type ToastVariant,
} from "@/store/use-toast-store";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "alert-success",
  error: "alert-error",
  info: "alert-info",
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = VARIANT_ICONS[toast.variant];

  function startTimer() {
    timerRef.current = setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS);
  }

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [toast.id]);

  return (
    <div
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={`alert ${VARIANT_STYLES[toast.variant]} animate-toast-in shadow-lg`}
    >
      <Icon data-no-flip className="size-5 shrink-0" />
      <span className="text-sm">{toast.message}</span>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="btn btn-ghost btn-xs btn-square"
        aria-label="Dismiss"
      >
        <X data-no-flip className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-end toast-bottom z-50">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
