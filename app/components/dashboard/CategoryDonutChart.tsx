import { useState } from "react";
import { createPortal } from "react-dom";
import { useCategoryColorVars } from "@/lib/category-colors";
import { Money } from "@/components/shared/Money";

interface DonutSlice {
  name: string;
  value: number;
}

export function CategoryDonutChart({
  slices,
  size = 128,
  strokeWidth = 18,
  /** "pie" fills the full disc (no hole) and never shows center text/numbers —
   * used where the chart itself should read as pure color, e.g. an
   * allocation split with the total called out separately below it. */
  variant = "donut",
  centerLabel,
  centerValue,
  selectedName,
  onSelectName,
}: {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  variant?: "donut" | "pie";
  centerLabel?: string;
  centerValue?: string;
  selectedName?: string | null;
  onSelectName?: (name: string) => void;
}) {
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(
    null,
  );
  const colors = useCategoryColorVars();

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  // A "pie" is just a donut whose ring thickness equals its own radius, so the
  // ring's inner edge reaches the center and no hole is visible.
  const effectiveStrokeWidth = variant === "pie" ? size / 2 : strokeWidth;
  const radius = (size - effectiveStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // A full pie reads best with its wedges flush against each other; the small
  // separating gap is reserved for the donut (it has a ring width narrow
  // enough that a hard seam between two colors looks noticeably harsher).
  const activeCount = slices.filter((s) => s.value > 0).length;
  const gapPx = variant === "donut" && activeCount > 1 ? 3 : 0;
  let cumulativeValue = 0;

  return (
    <div
      className="relative shrink-0 p-2"
      style={{ width: size + 16, height: size + 16 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-base-200)"
          strokeWidth={effectiveStrokeWidth}
        />
        {total > 0 &&
          slices.map((slice, i) => {
            // Derive each slice's start/end fresh from the running raw-value
            // sum (not by repeatedly accumulating a divided fraction) so
            // rounding error can't drift across many slices — and force the
            // last slice to close exactly at the circle's start, otherwise
            // that drift shows up as a visible seam/gap right where the last
            // slice meets the first.
            const isLast = i === slices.length - 1;
            const startFrac = cumulativeValue / total;
            cumulativeValue += slice.value;
            const endFrac = isLast ? 1 : cumulativeValue / total;
            const dash = Math.max(0, (endFrac - startFrac) * circumference - gapPx);
            const offset = circumference * (1 - startFrac);
            const isDimmed = selectedName != null && selectedName !== slice.name;
            const isHovered = hovered?.index === i;
            return (
              <circle
                key={slice.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={effectiveStrokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                onClick={onSelectName ? () => onSelectName(slice.name) : undefined}
                onMouseEnter={(e) => setHovered({ index: i, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setHovered({ index: i, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHovered(null)}
                style={{
                  transformOrigin: `${size / 2}px ${size / 2}px`,
                  transform: isHovered ? "scale(0.95)" : undefined,
                  filter: isHovered ? "brightness(0.85)" : undefined,
                }}
                className={`transition-[opacity,transform,filter] duration-200 ${onSelectName ? "cursor-pointer" : ""} ${isDimmed ? "opacity-30" : "opacity-100"}`}
              />
            );
          })}
      </svg>
      {variant === "donut" && (centerLabel || centerValue) && (
        <div className="absolute inset-2 flex flex-col items-center justify-center text-center">
          {centerValue && (
            <Money className="text-sm font-semibold tabular-nums">{centerValue}</Money>
          )}
          {centerLabel && (
            <span className="text-base-content/50 text-xs">{centerLabel}</span>
          )}
        </div>
      )}
      {hovered &&
        total > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            className="bg-neutral text-neutral-content pointer-events-none fixed z-9999 rounded-(--radius-field) px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
            style={{
              top: hovered.y - 8,
              left: hovered.x,
              transform: "translate(-50%, -100%)",
            }}
          >
            {slices[hovered.index].name}{" "}
            {Math.round((slices[hovered.index].value / total) * 100)}%
          </span>,
          document.body,
        )}
    </div>
  );
}
