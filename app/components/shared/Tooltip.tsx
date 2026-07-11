import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";

type Position = "top" | "bottom" | "start" | "end";

const GAP = 8;
/** Minimum distance kept between the bubble and the viewport edge when clamping. */
const VIEWPORT_PADDING = 8;

export function Tooltip({
  content,
  children,
  position = "top",
  className = "",
}: {
  content: string;
  children: ReactNode;
  position?: Position;
  className?: string;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    transform: string;
  } | null>(null);
  const [isSuppressed, setIsSuppressed] = useState(false);

  // Once the bubble has actually rendered at its natural position, pull it back
  // inward by whatever amount pokes past the viewport edge — the origin point
  // (and the `transform` centering) are left untouched, only `top`/`left` shift.
  useLayoutEffect(() => {
    if (!coords || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (rect.left < VIEWPORT_PADDING) dx = VIEWPORT_PADDING - rect.left;
    else if (rect.right > window.innerWidth - VIEWPORT_PADDING)
      dx = window.innerWidth - VIEWPORT_PADDING - rect.right;
    if (rect.top < VIEWPORT_PADDING) dy = VIEWPORT_PADDING - rect.top;
    else if (rect.bottom > window.innerHeight - VIEWPORT_PADDING)
      dy = window.innerHeight - VIEWPORT_PADDING - rect.bottom;
    if (dx !== 0 || dy !== 0) {
      setCoords((c) => (c ? { ...c, left: c.left + dx, top: c.top + dy } : c));
    }
  }, [coords]);

  function show(e?: SyntheticEvent) {
    // 1. If clicked recently, ignore generic focus events until mouse re-enters
    if (isSuppressed && e?.type !== "mouseenter") return;

    // 2. CRITICAL FIX: Ignore programmatic focus from closing modals.
    // Only show on focus if the user is navigating via keyboard.
    if (e?.type === "focus" && triggerRef.current) {
      try {
        if (!triggerRef.current.matches(":focus-visible")) {
          return;
        }
      } catch {
        // Fallback for very old browsers
      }
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isRtl =
      typeof document !== "undefined" && document.documentElement.dir === "rtl";

    if (position === "top") {
      setCoords({
        top: rect.top - GAP,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      });
    } else if (position === "bottom") {
      setCoords({
        top: rect.bottom + GAP,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, 0)",
      });
    } else if (position === "start") {
      setCoords({
        top: rect.top + rect.height / 2,
        left: isRtl ? rect.right + GAP : rect.left - GAP,
        transform: isRtl ? "translate(0, -50%)" : "translate(-100%, -50%)",
      });
    } else {
      setCoords({
        top: rect.top + rect.height / 2,
        left: isRtl ? rect.left - GAP : rect.right + GAP,
        transform: isRtl ? "translate(-100%, -50%)" : "translate(0, -50%)",
      });
    }
  }

  function hide() {
    setCoords(null);
  }

  function handleInteractionClick() {
    // Hide immediately and suppress showing again until explicit mouse enter
    setIsSuppressed(true);
    setCoords(null);
  }

  function handleMouseEnter(e: SyntheticEvent) {
    // Reset suppression when the user explicitly hovers again
    setIsSuppressed(false);
    show(e);
  }

  if (!content) return <>{children}</>;

  return (
    <span
      ref={triggerRef}
      className={`inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClickCapture={handleInteractionClick}
    >
      {children}
      {coords &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={tooltipRef}
            role="tooltip"
            className="bg-neutral text-neutral-content animate-fade-in pointer-events-none fixed z-[9999] rounded-(--radius-field) px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
            style={{ top: coords.top, left: coords.left, transform: coords.transform }}
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  );
}
