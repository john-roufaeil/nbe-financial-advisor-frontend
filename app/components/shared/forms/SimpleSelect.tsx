import type { ComponentType } from "react";
import { Check } from "lucide-react";
import {
  EntityPicker,
  type EntityPickerProps,
} from "@/components/shared/forms/EntityPicker";

export interface SimpleSelectOption {
  value: string;
  label: string;
  /** Optional leading icon (e.g. a category glyph), shown in both the
   * trigger and the option row. */
  icon?: ComponentType<{ className?: string; "data-no-flip"?: boolean }>;
}

/**
 * Custom-styled single-select for a flat list of value/label pairs — replaces
 * a native `<select>` wherever its browser-drawn menu (and the OS's own
 * selected-item checkmark, which can't be restyled to match the rest of the
 * app) doesn't fit. Built on EntityPicker for the open/close/dismiss/z-index
 * plumbing; the selected option gets its own styled checkmark plus a tinted
 * row background, matching AccountPicker's convention.
 */
export function SimpleSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  className,
  triggerSize,
  error,
  ariaDescribedBy,
}: {
  value: string;
  options: readonly SimpleSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** Shown in the trigger when `value` matches no option (e.g. an "all"/empty sentinel). */
  placeholder?: string;
  className?: string;
  triggerSize?: EntityPickerProps<SimpleSelectOption>["triggerSize"];
  error?: boolean;
  ariaDescribedBy?: string;
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <EntityPicker
      items={options}
      getKey={(o) => o.value}
      onSelect={(o) => onChange(o.value)}
      className={className}
      ariaLabel={ariaLabel}
      triggerSize={triggerSize}
      error={error}
      ariaDescribedBy={ariaDescribedBy}
      itemClassName={(o) => (o.value === value ? "bg-primary/10" : "")}
      trigger={
        <span
          className={`flex min-w-0 flex-1 items-center gap-1.5 text-start ${selected ? "" : "text-base-content/40"}`}
        >
          {selected?.icon && (
            <selected.icon data-no-flip className="size-4 shrink-0 opacity-70" />
          )}
          <span className="truncate">{selected?.label ?? placeholder ?? ""}</span>
        </span>
      }
      renderItem={(o) => {
        const isSelected = o.value === value;
        return (
          <>
            {o.icon && (
              <o.icon
                data-no-flip
                className={`size-4 shrink-0 ${isSelected ? "text-primary" : "opacity-60"}`}
              />
            )}
            <span
              className={`flex-1 truncate ${isSelected ? "text-primary font-medium" : ""}`}
            >
              {o.label}
            </span>
            {isSelected && (
              <Check data-no-flip className="text-primary size-4 shrink-0" />
            )}
          </>
        );
      }}
    />
  );
}
