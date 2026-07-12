import { forwardRef, useEffect, useState, type InputHTMLAttributes } from "react";
import { formatMoney, parseMoneyInput } from "@/lib/format";

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "max"
> {
  /** Raw numeric value; the field renders it comma-grouped (e.g. "1,234.5"). */
  value: number | "";
  /** Receives the parsed numeric value (or "" while the field is empty). */
  onChange: (value: number | "") => void;
  /** Clamps typed/committed values at this ceiling — `type="number"`'s native
   * `max` doesn't apply here since this is a text input under the hood. */
  max?: number;
}

/** Comma-groups the whole-number part of a raw digit string as the user
 * types, without forcing 2 decimal places or dropping a trailing "." —
 * formatMoney() does both, which would fight typing "12." into "12.5". */
function formatPartial(raw: string): string {
  const [whole, ...rest] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rest.length === 0 ? grouped : `${grouped}.${rest.join("").slice(0, 2)}`;
}

/**
 * A money `<input>` that comma-groups its integer part while typing.
 * `type="number"` can't do this — browsers reject non-digit characters — so
 * this is a plain text input that keeps its own display buffer (reformatted
 * on every keystroke via formatPartial) while reporting the parsed numeric
 * value up via onChange. Unlike the digits-only pattern in SliderField, a
 * single decimal point is allowed so this also covers cent-precision
 * amounts (transaction/account totals).
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput({ value, onChange, max, ...props }, ref) {
    const [text, setText] = useState(value === "" ? "" : formatMoney(value));

    // Re-sync the display buffer when the value changes from outside this
    // field (e.g. parent resets the form) rather than from our own typing,
    // which already keeps `text` and `value` in step on its own.
    useEffect(() => {
      const bufferedValue =
        text === "" || text === "." ? "" : Number(parseMoneyInput(text));
      if (bufferedValue !== value) {
        setText(value === "" ? "" : formatMoney(value));
      }
    }, [value]);

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const raw = parseMoneyInput(e.target.value);
          if (raw === "" || raw === ".") {
            setText(formatPartial(raw));
            onChange("");
            return;
          }
          const num = Number(raw);
          if (!Number.isFinite(num)) return;
          if (max !== undefined && num > max) {
            setText(formatMoney(max));
            onChange(max);
            return;
          }
          setText(formatPartial(raw));
          onChange(num);
        }}
        {...props}
      />
    );
  },
);
