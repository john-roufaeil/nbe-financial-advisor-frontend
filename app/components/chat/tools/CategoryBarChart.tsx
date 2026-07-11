import { CATEGORY_BAR_COLORS } from "@/lib/category-colors";

interface BarDatum {
  name: string;
  value: number;
  label: string;
}

export function CategoryBarChart({
  data,
  selectedName,
  onSelectName,
}: {
  data: BarDatum[];
  selectedName?: string | null;
  onSelectName?: (name: string) => void;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex w-full flex-col gap-2.5">
      {data.map((d, i) => {
        const isDimmed = selectedName != null && selectedName !== d.name;
        return (
          <button
            key={d.name}
            type="button"
            onClick={() => onSelectName?.(d.name)}
            className={`group flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-lg p-1 text-start transition-opacity duration-200 ${isDimmed ? "opacity-40" : "opacity-100"}`}
          >
            <span className="w-20 min-w-0 shrink-0 text-sm font-medium wrap-break-word">
              {d.name}
            </span>
            <span className="bg-base-200 h-5 min-w-16 flex-1 overflow-hidden rounded-full">
              <span
                className={`block h-full rounded-full transition-all duration-500 ease-out ${CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]}`}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </span>
            <span className="text-base-content/70 w-24 shrink-0 text-end text-xs tabular-nums">
              {d.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
