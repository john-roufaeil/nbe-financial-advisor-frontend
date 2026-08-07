import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from "@/lib/constants/layout";

/** Desktop sidebar drag-to-resize + collapse-on-drag behavior. */
export function useSidebarResize() {
  const sidebarWidth = useSidebarStore((s) => s.width);
  const setSidebarWidth = useSidebarStore((s) => s.setWidth);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, width: 0 });

  function startResizing(e: ReactMouseEvent) {
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, width: sidebarWidth };
    setIsDragging(true);
  }

  // Effect-scoped (rather than added directly in startResizing) so React's
  // cleanup runs on unmount too, not just on mouseup — otherwise a drag cut
  // short by the sidebar unmounting mid-drag would leak these document
  // listeners and leave the cursor/userSelect overrides stuck forever.
  useEffect(() => {
    if (!isDragging) return;

    // Prevent text-selection and show a consistent cursor over the whole page
    // while dragging, not just while the pointer is over the thin handle.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const doDrag = (dragEvent: MouseEvent) => {
      const isRtl = document.dir === "rtl" || document.documentElement.dir === "rtl";
      const delta = dragEvent.clientX - dragStartRef.current.x;
      // Reverse drag math if document is Right-to-Left
      const newWidth = isRtl
        ? dragStartRef.current.width - delta
        : dragStartRef.current.width + delta;
      const clampedWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, newWidth),
      );

      setSidebarWidth(clampedWidth);
      if (isCollapsed) setCollapsed(false);
    };

    const stopDrag = () => setIsDragging(false);

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };
  }, [isDragging, isCollapsed, setSidebarWidth, setCollapsed]);

  return { sidebarWidth, isDragging, startResizing };
}
