import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
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
      <Tooltip content="Dismiss">
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          className="btn btn-ghost btn-xs btn-square"
          aria-label="Dismiss"
        >
          <X data-no-flip className="size-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const hostRef = useRef<HTMLDivElement>(null);

  // Modals are native <dialog> elements, which the browser renders in the
  // top layer — no z-index can beat that. Promoting this host into the top
  // layer too (via the popover API) and re-showing it on every new toast
  // keeps it above whatever dialog/backdrop is currently open.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (toasts.length > 0) {
      if (!el.matches(":popover-open")) el.showPopover();
    } else if (el.matches(":popover-open")) {
      el.hidePopover();
    }
  }, [toasts.length]);

  return (
    <div ref={hostRef} popover="manual" className="toast toast-end toast-bottom z-50 m-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
