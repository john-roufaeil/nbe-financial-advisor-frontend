import { useEffect } from "react";

const RIPPLE_DURATION_MS = 500;

/**
 * Spawns a brief expanding ripple from the exact point the user pressed on any
 * `.btn`, one document-level listener instead of instrumenting every button —
 * the app-wide tactile "this registered" cue. Skips disabled buttons since
 * there's nothing to register. See the matching `.btn`/`.btn-ripple` rules in
 * app.css.
 */
export function useButtonRipple() {
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(".btn");
      if (!target || target.hasAttribute("disabled")) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const span = document.createElement("span");
      span.className = "btn-ripple";
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;

      target.appendChild(span);
      span.addEventListener("animationend", () => span.remove());
      // Belt-and-braces cleanup in case animationend never fires (e.g. the
      // button is removed from the DOM mid-animation).
      setTimeout(() => span.remove(), RIPPLE_DURATION_MS + 100);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);
}
