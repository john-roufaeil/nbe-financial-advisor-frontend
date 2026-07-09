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
}: {
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-text text-xs">{label}</span>
      <div className="flex flex-wrap gap-1.5">
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
