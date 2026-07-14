/** Binds MoneyInput to a react-hook-form field whose value is kept as a
 * string ("" while empty) — e.g. the goals and allocations edit forms —
 * converting between the field's string and MoneyInput's number both ways.
 * (Own file rather than MoneyInput.tsx so fast refresh keeps working there.) */
export function moneyFieldBinding(field: {
  value: string;
  onChange: (value: string) => void;
}): {
  value: number | "";
  onChange: (value: number | "") => void;
} {
  return {
    value: field.value === "" ? "" : Number(field.value),
    onChange: (v) => field.onChange(v === "" ? "" : String(v)),
  };
}
