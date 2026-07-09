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
}: SliderFieldProps) {
  function clamp(v: number) {
    return Math.min(max, Math.max(min, v));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-text text-xs">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range range-primary range-sm flex-1 cursor-grab active:cursor-grabbing"
        />
        <label className="input input-xs input-bordered flex shrink-0 items-center gap-1 ps-2">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
            className="text-primary shrink-0 text-end font-semibold tabular-nums"
            style={{ width: `${Math.max(4, String(value).length + 2.5)}ch` }}
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
