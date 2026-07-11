interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Compact horizontal-wrapping one-click chip picker — for steps with several
 * short options. Clicking the already-selected chip deselects it (sets value
 * to ""), since these fields are optional on their onboarding step.
 */
export function ChipPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** When set, a red dot appears beside the label — this field is required
   * by the step's "all or nothing" rule but hasn't been picked yet. The
   * string itself is used only as the dot's accessible label. */
  error?: string;
}) {
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
      <div className="flex flex-wrap gap-1.5 rounded-lg">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? ("" as T) : opt.value)}
            aria-pressed={value === opt.value}
            className={`btn btn-sm cursor-pointer select-none ${
              value === opt.value ? "btn-primary" : "btn-outline"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
