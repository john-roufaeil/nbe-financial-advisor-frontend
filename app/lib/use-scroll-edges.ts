import { useEffect, useRef, useState } from "react";

/** Tracks whether a scrollable element is at its top/bottom edge. */
export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      setAtTop(el.scrollTop <= 4);
      setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 4);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return { ref, atTop, atBottom };
}
