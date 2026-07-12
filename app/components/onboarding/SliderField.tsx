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
  /** When set, a red dot appears beside the label — this field is required
   * by the step's "all or nothing" rule but is still at its default. The
   * string itself is used only as the dot's accessible label. */
  error?: string;
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
}: SliderFieldProps) {
  function clamp(v: number) {
    return Math.min(max, Math.max(min, v));
  }

  // Thousands-separated display (e.g. "500,000") — type="number" can't show
  // commas at all (browsers reject non-digit characters), so this is a plain
  // text input that strips everything but digits back out on change.
  const formattedValue = value.toLocaleString();

  // Calculate dynamic character width based on length + a slight safety margin
  // (+2, not +1 — number inputs' spin-adjacent padding and tabular-nums
  // digits need a bit more breathing room than a plain text field would).
  const inputWidth = `${Math.max(3, formattedValue.length + 2)}ch`;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-text inline-flex items-center gap-1.5 text-xs">
        {label}
        {error && (
          <span
            className="bg-error inline-block size-1.5 shrink-0 rounded-full"
            role="img"
            aria-label={error}
          />
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
          className="input input-bordered flex w-max shrink-0 items-center gap-1 px-2"
        >
          <input
            type="text"
            inputMode="numeric"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            value={formattedValue}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              onChange(clamp(digits === "" ? 0 : Number(digits)));
            }}
            className="text-primary w-auto shrink-0 bg-transparent text-end font-semibold tabular-nums focus:outline-none"
            style={{ width: inputWidth }}
          />
          {unit && (
            <span className="text-base-content/50 shrink-0 text-[0.65rem]">{unit}</span>
          )}
        </label>
      </div>

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
