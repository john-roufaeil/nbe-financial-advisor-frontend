import type { ComponentType } from "react";
import { Tooltip } from "@/components/shared/Tooltip";

type IconComponent = ComponentType<{ className?: string }>;

interface ToggleSwitchProps<T extends string> {
  value: T;
  options: readonly [T, T];
  labels: Record<T, string>;
  icons?: Record<T, IconComponent>;
  onChange: (next: T) => void;
  "aria-label": string;
  /** Pins options[0] to the visual left and options[1] to the visual right regardless of page direction. */
  forceLtrOrder?: boolean;
  /** When false, each option shows only its icon (requires `icons`) and its
   * label becomes a hover/focus tooltip instead of visible text. */
  showLabels?: boolean;
}

export function ToggleSwitch<T extends string>({
  value,
  options,
  labels,
  icons,
  onChange,
  "aria-label": ariaLabel,
  forceLtrOrder,
  showLabels = true,
}: ToggleSwitchProps<T>) {
  const active = value === options[0] ? 0 : 1;

  function toggle() {
    onChange(options[active === 0 ? 1 : 0]);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      className={`border-base-300 bg-base-200 focus-visible:outline-primary/50 relative flex w-full min-w-0 cursor-pointer items-center rounded-md border p-1 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        forceLtrOrder ? "rtl:flex-row-reverse" : ""
      }`}
    >
      <span
        className={`bg-primary absolute inset-y-1 ${forceLtrOrder ? "left-1" : "inset-s-1"} w-[calc(50%-0.375rem)] rounded-lg shadow-sm transition-transform duration-200 ease-out ${
          active === 1
            ? forceLtrOrder
              ? "translate-x-[calc(100%+0.25rem)]"
              : "translate-x-[calc(100%+0.25rem)] rtl:-translate-x-[calc(100%+0.25rem)]"
            : ""
        }`}
      />
      {options.map((opt) => {
        const Icon: IconComponent | undefined = icons?.[opt];
        const isActive = opt === value;
        const content = (
          <span
            className={`relative z-10 flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-sm leading-tight font-medium wrap-break-word transition-colors ${
              isActive ? "text-primary-content" : "text-base-content/50"
            }`}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            {showLabels ? (
              <span className="min-w-0 text-center">{labels[opt]}</span>
            ) : (
              <span className="sr-only">{labels[opt]}</span>
            )}
          </span>
        );

        return showLabels ? (
          <span key={opt} className="flex min-w-0 flex-1">
            {content}
          </span>
        ) : (
          <Tooltip key={opt} content={labels[opt]} className="min-w-0 flex-1">
            {content}
          </Tooltip>
        );
      })}
    </button>
  );
}
