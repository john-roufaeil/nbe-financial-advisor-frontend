import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from "@/lib/constants/layout";

/** Desktop sidebar drag-to-resize + collapse-on-drag behavior. */
export function useSidebarResize() {
  const sidebarWidth = useSidebarStore((s) => s.width);
  const setSidebarWidth = useSidebarStore((s) => s.setWidth);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const [isDragging, setIsDragging] = useState(false);

  function startResizing(e: ReactMouseEvent) {
    e.preventDefault();
    setIsDragging(true);
    // Prevent text-selection and show a consistent cursor over the whole page
    // while dragging, not just while the pointer is over the thin handle.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (dragEvent: MouseEvent) => {
      const isRtl = document.dir === "rtl" || document.documentElement.dir === "rtl";
      const delta = dragEvent.clientX - startX;
      // Reverse drag math if document is Right-to-Left
      const newWidth = isRtl ? startWidth - delta : startWidth + delta;
      const clampedWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, newWidth),
      );

      setSidebarWidth(clampedWidth);
      if (isCollapsed) setCollapsed(false);
    };

    const stopDrag = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  }

  return { sidebarWidth, isDragging, startResizing };
}
