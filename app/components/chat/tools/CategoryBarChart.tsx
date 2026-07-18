import { useCategoryStyle } from "@/lib/use-category-style";
import { categoryIcon } from "@/lib/constants/category-icons";

interface BarDatum {
  name: string;
  value: number;
  label: string;
  /** Display text, if it differs from `name` (which stays the selection/key identity). */
  displayName?: string;
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
  const { barClass } = useCategoryStyle();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex w-full flex-col gap-2.5">
      {data.map((d) => {
        const isDimmed = selectedName != null && selectedName !== d.name;
        const Icon = categoryIcon(d.name);
        return (
          <button
            key={d.name}
            type="button"
            onClick={() => onSelectName?.(d.name)}
            className={`group focus-visible:outline-primary/50 flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-md p-1 text-start transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${isDimmed ? "opacity-40" : "opacity-100"}`}
          >
            <span className="flex w-20 min-w-0 shrink-0 items-center gap-1.5 text-sm font-medium wrap-break-word">
              <Icon data-no-flip className="size-3.5 shrink-0 opacity-60" />
              {d.displayName ?? d.name}
            </span>
            <span className="bg-base-200 h-5 min-w-16 flex-1 overflow-hidden rounded-full">
              <span
                className={`block h-full rounded-full transition-all duration-500 ease-out ${barClass(d.name)}`}
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
