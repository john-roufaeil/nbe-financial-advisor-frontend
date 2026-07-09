import { CATEGORY_COLOR_VARS } from "@/lib/category-colors";
import { Money } from "@/components/shared/Money";

interface DonutSlice {
  name: string;
  value: number;
}

export function CategoryDonutChart({
  slices,
  size = 128,
  strokeWidth = 18,
  centerLabel,
  centerValue,
  selectedName,
  onSelectName,
}: {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  /** Optional: dims non-selected slices and makes slices clickable/hoverable. */
  selectedName?: string | null;
  onSelectName?: (name: string) => void;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const activeCount = slices.filter((s) => s.value > 0).length;
  const gapPx = activeCount > 1 ? 3 : 0;
  let cumulative = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          slices.map((slice, i) => {
            const pct = slice.value / total;
            const dash = Math.max(0, pct * circumference - gapPx);
            const offset = -cumulative * circumference;
            cumulative += pct;
            const isDimmed = selectedName != null && selectedName !== slice.name;
            return (
              <circle
                key={slice.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={CATEGORY_COLOR_VARS[i % CATEGORY_COLOR_VARS.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                onClick={onSelectName ? () => onSelectName(slice.name) : undefined}
                className={`transition-opacity duration-200 ${onSelectName ? "cursor-pointer" : ""} ${isDimmed ? "opacity-30" : "opacity-100"}`}
              />
            );
          })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && (
            <Money className="text-sm font-semibold tabular-nums">{centerValue}</Money>
          )}
          {centerLabel && (
            <span className="text-base-content/50 text-[10px]">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
