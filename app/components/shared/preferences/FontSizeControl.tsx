import { Minus, Plus, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { ACCESSIBILITY_LIMITS } from "@/lib/constants/accessibility";

export function FontSizeControl({
  fontScale,
  sliderValue,
  onSliderChange,
  onCommit,
  onIncrease,
  onDecrease,
  onReset,
}: {
  fontScale: number;
  sliderValue: number;
  onSliderChange: (value: number) => void;
  onCommit: (value: number) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const { MIN_SCALE, MAX_SCALE, DEFAULT_SCALE } = ACCESSIBILITY_LIMITS;
  const fontPercent = Math.round((sliderValue / DEFAULT_SCALE) * 100);

  return (
    <div className="border-base-300 bg-base-200/50 rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          {t("settings.accessibility.fontSize")}
        </span>
        <span className="text-base-content/60 text-xs tabular-nums">{fontPercent}%</span>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip content={t("settings.accessibility.decreaseFontSize")}>
          <button
            type="button"
            onClick={onDecrease}
            disabled={fontScale <= MIN_SCALE}
            aria-label={t("settings.accessibility.decreaseFontSize")}
            className="btn btn-outline btn-square btn-sm"
          >
            <Minus data-no-flip className="size-4" />
          </button>
        </Tooltip>
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.2}
          value={sliderValue}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          onPointerUp={(e) => onCommit(Number(e.currentTarget.value))}
          onKeyUp={(e) => onCommit(Number(e.currentTarget.value))}
          aria-label={t("settings.accessibility.fontSize")}
          className="range range-primary range-sm flex-1 cursor-grab active:cursor-grabbing"
        />
        <Tooltip content={t("settings.accessibility.increaseFontSize")}>
          <button
            type="button"
            onClick={onIncrease}
            disabled={fontScale >= MAX_SCALE}
            aria-label={t("settings.accessibility.increaseFontSize")}
            className="btn btn-outline btn-square btn-sm"
          >
            <Plus data-no-flip className="size-4" />
          </button>
        </Tooltip>
      </div>
      <button
        type="button"
        onClick={onReset}
        disabled={fontScale === DEFAULT_SCALE}
        className="btn btn-ghost btn-xs mt-2 gap-1.5"
      >
        <RotateCcw data-no-flip className="size-3.5" />
        {t("settings.accessibility.resetFontSize")}
      </button>
    </div>
  );
}
