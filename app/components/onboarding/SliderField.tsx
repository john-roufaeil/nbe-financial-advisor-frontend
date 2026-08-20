import { useId } from "react";
import { ChevronUp, ChevronDown, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { RequiredMark } from "@/components/onboarding/RequiredMark";
import { useHoldRepeat } from "@/lib/use-hold-repeat";
import { useHighlightRef } from "@/lib/use-highlight-ref";

const THUMB_SIZE = "1.75rem";

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Quick-pick chips shown below the slider for common values. */
  presets?: { value: number; label: string }[];
  /** Unit shown next to the numeric input, e.g. a currency label. */
  unit?: string;
  error?: string;
  /** Marks the label with the same asterisk AccountStep's hard-required
   * fields use. */
  required?: boolean;
  /** Definition shown in a tooltip behind an info icon beside the label, for
   * a field whose meaning isn't self-evident from its name alone. */
  info?: string;
  /** Briefly rings and scrolls this field into view — set when the user
   * jumps here from PlanSummary's "edit" affordance. */
  highlighted?: boolean;
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  presets,
  unit,
  error,
  required,
  info,
  highlighted,
}: SliderFieldProps) {
  const { t } = useTranslation();
  const errorId = useId();
  const highlightRef = useHighlightRef<HTMLDivElement>(highlighted);

  function clamp(v: number) {
    return Math.min(max, Math.max(min, v));
  }

  function adjust(direction: 1 | -1) {
    onChange(clamp(value + direction * step));
  }

  const increaseHold = useHoldRepeat(() => adjust(1));
  const decreaseHold = useHoldRepeat(() => adjust(-1));

  // Thousands-separated display (e.g. "500,000") — type="number" can't show
  // commas at all (browsers reject non-digit characters), so this is a plain
  // text input that strips everything but digits back out on change.
  const formattedValue = value.toLocaleString();

  // Calculate dynamic character width based on length + a slight safety margin
  // (+2, not +1 — number inputs' spin-adjacent padding and tabular-nums
  // digits need a bit more breathing room than a plain text field would).
  const inputWidth = `${Math.max(3, formattedValue.length + 2)}ch`;

  return (
    <div
      ref={highlightRef}
      className={`flex flex-col gap-1.5 rounded-lg transition-shadow ${
        highlighted ? "ring-primary ring-offset-base-100 ring-2 ring-offset-2" : ""
      }`}
    >
      <span className="label-text inline-flex items-center gap-1.5 text-xs">
        {label}
        {required && <RequiredMark />}
        {info && (
          <Tooltip content={info}>
            <button
              type="button"
              aria-label={info}
              className="text-base-content/40 hover:text-primary inline-flex"
            >
              <Info data-no-flip className="size-3.5" />
            </button>
          </Tooltip>
        )}
      </span>
      <div className="flex w-full items-center gap-3 rounded-lg">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          // Scoped thumb-size override (daisyUI CSS var) so only this slider
          // gets a larger touch-friendly thumb, not every `.range` in the app.
          style={{ "--range-thumb-size": THUMB_SIZE } as React.CSSProperties}
          className="range range-primary range-sm w-full flex-1 cursor-grab active:cursor-grabbing"
        />

        {/* Fixed to the same height as the slider's thumb above (not a
            daisyUI input-* size step, since none lands on 1.75rem) so the
            number field doesn't look visually smaller than the control it's
            paired with. */}
        <label
          style={{ height: THUMB_SIZE }}
          className={`input input-bordered flex w-max shrink-0 items-center gap-1 px-2 ${error ? "input-error" : ""}`}
        >
          <input
            type="text"
            inputMode="numeric"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            value={formattedValue}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              onChange(clamp(digits === "" ? 0 : Number(digits)));
            }}
            // Mirrors the paired range input's native ArrowUp/Down stepping —
            // this box is a plain text input (for comma-grouping, which
            // type="number" can't show), so it has no such behavior for free.
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              adjust(e.key === "ArrowUp" ? 1 : -1);
            }}
            className="text-primary w-auto shrink-0 bg-transparent text-end font-semibold tabular-nums focus:outline-none"
            style={{ width: inputWidth }}
          />
          {unit && (
            <span className="text-base-content/50 shrink-0 text-[0.65rem]">{unit}</span>
          )}
          {/* Visible spinner mirroring the keyboard ArrowUp/Down support above —
              this box is a plain text input, so it has no native spinner. */}
          <span className="flex shrink-0 flex-col self-stretch">
            <button
              type="button"
              onClick={() => adjust(1)}
              {...increaseHold}
              disabled={value >= max}
              aria-label={t("actions.increase", { name: label })}
              className="text-base-content/50 hover:text-primary flex flex-1 cursor-pointer items-center disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronUp data-no-flip className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => adjust(-1)}
              {...decreaseHold}
              disabled={value <= min}
              aria-label={t("actions.decrease", { name: label })}
              className="text-base-content/50 hover:text-primary flex flex-1 cursor-pointer items-center disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronDown data-no-flip className="size-3" />
            </button>
          </span>
        </label>
      </div>

      {error && (
        <span id={errorId} role="alert" className="text-error text-xs">
          {error}
        </span>
      )}

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-pressed={value === preset.value}
              className={`btn btn-xs cursor-pointer select-none ${
                value === preset.value ? "btn-primary" : "btn-outline"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
