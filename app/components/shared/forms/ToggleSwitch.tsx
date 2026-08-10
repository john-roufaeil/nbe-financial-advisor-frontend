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
  disabled?: boolean;
  /** Disables the toggle and overlays a spinner — same app-wide pattern as
   * `Button`'s `loading` prop, for an async switch that can't be
   * double-submitted and needs a visible in-flight cue. */
  loading?: boolean;
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
  disabled = false,
  loading = false,
}: ToggleSwitchProps<T>) {
  const active = value === options[0] ? 0 : 1;

  function toggle() {
    onChange(options[active === 0 ? 1 : 0]);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={disabled || loading}
      className={`group/toggle focus-visible:outline-primary/50 relative flex w-full min-w-0 cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        forceLtrOrder ? "rtl:flex-row-reverse" : ""
      }`}
    >
      {loading ? (
        <span className="flex w-full items-center justify-center py-1.5">
          <span className="loading loading-spinner loading-xs" />
        </span>
      ) : (
        <>
          {/* Faint full-width baseline under both options, with a solid
              primary segment overlaid on the active half — a tab-style
              underline instead of a filled pill, so the control stays flat
              and minimal rather than a colored block. On hover, the segment
              stays anchored under the active option but leans slightly
              toward the other one — a hint that it's switchable, not a full
              preview — and eases back on mouse-leave. */}
          <span className="bg-base-300 absolute inset-x-0 bottom-0 h-px" />
          <span
            className={`bg-primary absolute bottom-0 h-0.5 w-1/2 transition-transform duration-200 ease-out ${forceLtrOrder ? "left-0" : "inset-s-0"} ${
              active === 1
                ? forceLtrOrder
                  ? "translate-x-full"
                  : "translate-x-full rtl:-translate-x-full"
                : ""
            } ${
              active === 1
                ? forceLtrOrder
                  ? "group-hover/toggle:translate-x-[90%]"
                  : "group-hover/toggle:translate-x-[90%] group-hover/toggle:rtl:translate-x-[-90%]"
                : forceLtrOrder
                  ? "group-hover/toggle:translate-x-[10%]"
                  : "group-hover/toggle:translate-x-[10%] group-hover/toggle:rtl:translate-x-[-10%]"
            }`}
          />
          {options.map((opt) => {
            const Icon: IconComponent | undefined = icons?.[opt];
            const isActive = opt === value;
            const content = (
              <span
                className={`relative flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 pt-1 pb-2 text-sm leading-tight font-medium transition-colors duration-200 ease-out ${
                  isActive
                    ? "text-primary group-hover/toggle:text-primary/75"
                    : "text-base-content/45 group-hover/toggle:text-base-content/70"
                }`}
              >
                {Icon && <Icon className="size-3.5 shrink-0" />}
                {showLabels ? (
                  <span className="min-w-0 truncate text-center">{labels[opt]}</span>
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
        </>
      )}
    </button>
  );
}
