import { RequiredMark } from "@/components/onboarding/RequiredMark";

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
  required,
}: {
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  /** Marks the label with the same asterisk AccountStep's hard-required
   * fields use — for a field that's always required, not just conditionally
   * flagged once the step is dirty (see `error` above). */
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-text inline-flex items-center gap-1.5 text-xs">
        {label}
        {required && <RequiredMark />}
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
