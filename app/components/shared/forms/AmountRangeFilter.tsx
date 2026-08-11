import type { ChangeEvent, CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";
import { MAX_MONEY_VALUE } from "@/lib/format";
import { TRANSACTION_AMOUNT_FILTER_MAX } from "@/lib/constants/limits";

const SLIDER_MAX = TRANSACTION_AMOUNT_FILTER_MAX;

// Disables daisyUI's built-in fill (a box-shadow trail from the thumb to one
// edge — only ever right for a single-thumb slider) and its track background,
// so two of these can be stacked as one dual-handle slider with our own
// track/fill drawn underneath instead.
const NATIVE_FILL_OFF = {
  "--range-fill": 0,
  "--range-bg": "transparent",
} as CSSProperties;

/**
 * A single min/max bound: a money input paired with a slider handle sharing
 * the same track. Reaching the slider's empty-side end (0 for min, SLIDER_MAX
 * for max) clears the bound back to "no filter" rather than committing to
 * that edge value literally.
 */
export function AmountRangeFilter({
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  min: number | "";
  max: number | "";
  onMinChange: (value: number | "") => void;
  onMaxChange: (value: number | "") => void;
}) {
  const { t } = useTranslation();
  const minLabel = t("common.amountMin");
  const maxLabel = t("common.amountMax");
  const unit = t("currency.EGP");

  const minSlider = min === "" ? 0 : Math.min(min, SLIDER_MAX);
  const maxSlider = max === "" ? SLIDER_MAX : Math.min(max, SLIDER_MAX);
  const minPercent = (minSlider / SLIDER_MAX) * 100;
  const maxPercent = (maxSlider / SLIDER_MAX) * 100;

  function handleMinSlider(e: ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    onMinChange(next === 0 ? "" : next);
  }
  function handleMaxSlider(e: ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    onMaxChange(next === SLIDER_MAX ? "" : next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <MoneyInput
          value={min}
          onChange={onMinChange}
          max={MAX_MONEY_VALUE}
          unit={unit}
          hideSteppers
          placeholder={minLabel}
          aria-label={minLabel}
          className="input-sm w-1/2"
        />
        <MoneyInput
          value={max}
          onChange={onMaxChange}
          max={MAX_MONEY_VALUE}
          unit={unit}
          hideSteppers
          placeholder={maxLabel}
          aria-label={maxLabel}
          className="input-sm w-1/2"
        />
      </div>

      {/* One shared track: two overlaid range inputs (pointer-events limited
          to their thumb, via the pseudo-element variants below) so each
          handle is independently draggable without either one's hit area
          blocking the other. */}
      <div className="relative flex h-5 items-center">
        <div className="bg-base-300 pointer-events-none absolute inset-x-0 h-1.5 rounded-full" />
        <div
          className="bg-primary pointer-events-none absolute h-1.5 rounded-full"
          style={{
            insetInlineStart: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={SLIDER_MAX}
          value={minSlider}
          onChange={handleMinSlider}
          aria-label={minLabel}
          style={NATIVE_FILL_OFF}
          className="range range-primary range-sm pointer-events-none absolute inset-x-0 w-full [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
        />
        <input
          type="range"
          min={0}
          max={SLIDER_MAX}
          value={maxSlider}
          onChange={handleMaxSlider}
          aria-label={maxLabel}
          style={NATIVE_FILL_OFF}
          className="range range-primary range-sm pointer-events-none absolute inset-x-0 w-full [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
        />
      </div>
    </div>
  );
}
