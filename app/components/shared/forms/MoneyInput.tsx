import {
  forwardRef,
  useEffect,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMoney, parseMoneyInput } from "@/lib/format";
import { useHoldRepeat } from "@/lib/use-hold-repeat";

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "max" | "className"
> {
  /** Raw numeric value; the field renders it comma-grouped (e.g. "1,234.5"). */
  value: number | "";
  /** Receives the parsed numeric value (or "" while the field is empty). */
  onChange: (value: number | "") => void;
  /** Clamps typed/committed values at this ceiling — `type="number"`'s native
   * `max` doesn't apply here since this is a text input under the hood. */
  max?: number;
  /** Trailing label shown inside the box, e.g. a currency code. Omit it to
   * keep a currency label as a sibling outside the box instead. */
  unit?: string;
  /** Amount the spinner buttons/arrow keys move per step. Defaults to 1;
   * pass e.g. 1000 for a field whose presets are also in round thousands. */
  step?: number;
  /** Hides the flanking minus/plus buttons, giving the digits the full box
   * width — for narrow contexts (e.g. a half-width field next to a sibling)
   * where the buttons would otherwise squeeze the value down to a sliver.
   * ArrowUp/ArrowDown keyboard stepping still works either way. */
  hideSteppers?: boolean;
  /** Applied to the outer bordered box (e.g. "input-sm", "input-error") —
   * this component owns the box now, not just the bare `<input>`. */
  className?: string;
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
 *
 * Owns its own bordered box (like a daisyUI `.input`) rather than being a
 * bare `<input>`. Flanking minus/plus buttons sit on either side of the
 * text — always visible (never hover-only) and large enough to be an easy
 * tap target, rather than a browser-style spinner stacked to one side.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput(
    {
      value,
      onChange,
      max,
      unit,
      step: stepAmount = 1,
      hideSteppers = false,
      className = "",
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const { t } = useTranslation();
    const [text, setText] = useState(value === "" ? "" : formatMoney(value));

    function step(direction: 1 | -1) {
      const current = value === "" ? 0 : value;
      const next = Math.max(0, current + direction * stepAmount);
      const clamped = max !== undefined ? Math.min(next, max) : next;
      setText(formatMoney(clamped));
      onChange(clamped);
    }

    // Native `type="number"` steps the value on ArrowUp/ArrowDown; this text
    // input needs to replicate that manually since it has no such behavior.
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(e);
      if (e.defaultPrevented || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      step(e.key === "ArrowUp" ? 1 : -1);
    }

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

    const numericValue = value === "" ? 0 : value;
    const decrementHold = useHoldRepeat(() => step(-1));
    const incrementHold = useHoldRepeat(() => step(1));

    return (
      <span className={`input input-bordered flex items-center gap-1 p-1 ${className}`}>
        {!hideSteppers && (
          <button
            type="button"
            onClick={() => step(-1)}
            {...decrementHold}
            disabled={numericValue <= 0}
            aria-label={t("actions.decrease", { name: props["aria-label"] ?? "" })}
            className="text-base-content/60 hover:bg-base-200 hover:text-primary flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus data-no-flip className="size-4" />
          </button>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={text}
          onKeyDown={handleKeyDown}
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
          className="min-w-0 grow bg-transparent text-center focus:outline-none"
          {...props}
        />
        {unit && <span className="text-base-content/50 shrink-0 text-xs">{unit}</span>}
        {!hideSteppers && (
          <button
            type="button"
            onClick={() => step(1)}
            {...incrementHold}
            disabled={max !== undefined && numericValue >= max}
            aria-label={t("actions.increase", { name: props["aria-label"] ?? "" })}
            className="text-base-content/60 hover:bg-base-200 hover:text-primary flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus data-no-flip className="size-4" />
          </button>
        )}
      </span>
    );
  },
);
