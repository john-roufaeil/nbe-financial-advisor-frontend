import type { LucideIcon } from "lucide-react";

export function HighlightStatCard({
  icon: Icon,
  label,
  value,
  colorClass = "bg-primary text-primary-content",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <div
      className={`relative min-w-32 flex-1 overflow-hidden rounded-xl p-4 ${colorClass}`}
    >
      <Icon data-no-flip className="absolute -end-3 -top-3 size-20 opacity-15" />
      <p className="relative truncate text-xs opacity-80">{label}</p>
      <p className="relative mt-1 truncate text-xl font-bold tabular-nums sm:text-2xl">
        {value}
      </p>
    </div>
  );
}
