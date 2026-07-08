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
    <div className={`relative flex-1 overflow-hidden rounded-2xl p-4 ${colorClass}`}>
      <Icon data-no-flip className="absolute -end-3 -top-3 size-20 opacity-15" />
      <p className="relative text-xs opacity-80">{label}</p>
      <p className="relative mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
