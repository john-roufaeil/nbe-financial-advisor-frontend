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

  // Calculate dynamic character width based on length + a slight safety margin
  const inputWidth = `${Math.max(3, String(value).length + 1)}ch`;

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
          style={{ "--range-thumb-size": "1.75rem" } as React.CSSProperties}
          className="range range-primary range-sm w-full flex-1 cursor-grab active:cursor-grabbing"
        />

        <label className="input input-xs input-bordered flex w-max shrink-0 items-center gap-1 px-2">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
            /* Added the 'no-spin-buttons' class here */
            className="no-spin-buttons text-primary w-auto shrink-0 bg-transparent text-end font-semibold tabular-nums focus:outline-none"
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
