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
  /** `link` (default) is a plain text toggle; `btn-ghost` renders it as a ghost button. */
  variant?: "link" | "btn-ghost";
}

/**
 * A minimal toggle for binary settings: shows only the label of the option
 * you'd switch *to*. Defaults to a plain link-style button (no track/thumb);
 * pass `variant="btn-ghost"` to render it as a ghost button instead.
 */
export function LinkToggle<T extends string>({
  value,
  options,
  labels,
  icons,
  onChange,
  "aria-label": ariaLabel,
  className = "",
  variant = "link",
}: LinkToggleProps<T>) {
  const next = value === options[0] ? options[1] : options[0];
  const Icon: IconComponent | undefined = icons?.[next];

  const variantClassName =
    variant === "btn-ghost"
      ? "btn btn-ghost bg-base-200 gap-1.5 font-medium"
      : "text-base-content/70 hover:text-primary flex min-h-11 cursor-pointer items-center gap-1.5 py-2 text-sm font-medium transition-colors hover:underline focus-visible:outline-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-md";

  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={ariaLabel ?? labels[next]}
      className={`${variantClassName} ${className}`}
    >
      {Icon && <Icon className="size-3.5 shrink-0" />}
      <span>{labels[next]}</span>
    </button>
  );
}
