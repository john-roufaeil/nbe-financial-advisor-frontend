import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

interface LinkToggleProps<T extends string> {
  value: T;
  options: readonly [T, T];
  /** Label shown for each option when it is the *target* of the link (i.e. not the current value). */
  labels: Record<T, string>;
  icons?: Record<T, IconComponent>;
  onChange: (next: T) => void;
  "aria-label"?: string;
  className?: string;
}

/**
 * A minimal link-style toggle for binary settings: shows only the label of
 * the option you'd switch *to*, as a plain text button (no track/thumb).
 */
export function LinkToggle<T extends string>({
  value,
  options,
  labels,
  icons,
  onChange,
  "aria-label": ariaLabel,
  className = "",
}: LinkToggleProps<T>) {
  const next = value === options[0] ? options[1] : options[0];
  const Icon: IconComponent | undefined = icons?.[next];

  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={ariaLabel ?? labels[next]}
      className={`text-base-content/70 hover:text-primary flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors hover:underline ${className}`}
    >
      {Icon && <Icon className="size-3.5 shrink-0" />}
      <span>{labels[next]}</span>
    </button>
  );
}
