import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useDismissablePanel } from "@/lib/use-dismissable-panel";
import { Z_POPOVER } from "@/lib/z-index";

const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i);

function periodOf(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function periodLabel(period: string, locale: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
}

function monthAbbr(year: number, monthIndex: number, locale: string): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(locale, { month: "short" });
}

/**
 * Calendar-style month/year popover — same trigger+portal+dismiss shell as
 * EntityPicker, but with a year-nav header + 3x4 month grid since EntityPicker's
 * API assumes a flat scrollable list, not a 2D calendar grid.
 */
export function MonthPicker({
  value,
  onChange,
  availablePeriods,
}: {
  /** YYYY-MM */
  value: string;
  onChange: (period: string) => void;
  /** YYYY-MM, months with no data get disabled (see BudgetMonthNav's docstring). */
  availablePeriods: readonly string[];
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [displayedYear, setDisplayedYear] = useState(() => Number(value.split("-")[0]));
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  const availableSet = new Set(availablePeriods);
  const years = availablePeriods.map((p) => Number(p.split("-")[0]));
  const minYear = years.length > 0 ? Math.min(...years) : Number(value.split("-")[0]);
  const maxYear = years.length > 0 ? Math.max(...years) : Number(value.split("-")[0]);

  const updateCoords = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useDismissablePanel({
    open,
    onClose: close,
    panelRef,
    triggerRef,
    reposition: updateCoords,
  });

  const [selectedYear, selectedMonth] = value.split("-").map(Number);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setDisplayedYear(selectedYear);
          updateCoords();
          setOpen((v) => !v);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("budget.progress.selectMonth")}
        className="btn btn-ghost btn-sm gap-1.5"
      >
        <Calendar data-no-flip className="text-primary size-4" />
        <span className="tabular-nums">{periodLabel(value, i18n.language)}</span>
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            data-floating-menu=""
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: Z_POPOVER,
            }}
            className="border-base-300 bg-base-100 animate-entry w-56 rounded-xl border p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDisplayedYear((y) => y - 1)}
                disabled={displayedYear <= minYear}
                aria-label={t("budget.progress.previousYear")}
                className="btn btn-ghost btn-xs btn-square"
              >
                <ChevronLeft data-no-flip className="size-4" />
              </button>
              <span className="text-sm font-semibold tabular-nums">{displayedYear}</span>
              <button
                type="button"
                onClick={() => setDisplayedYear((y) => y + 1)}
                disabled={displayedYear >= maxYear}
                aria-label={t("budget.progress.nextYear")}
                className="btn btn-ghost btn-xs btn-square"
              >
                <ChevronRight data-no-flip className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTH_INDEXES.map((m) => {
                const period = periodOf(displayedYear, m);
                const isSelected =
                  displayedYear === selectedYear && m + 1 === selectedMonth;
                const isDisabled = !availableSet.has(period);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onChange(period);
                      close();
                    }}
                    className={`btn btn-sm ${
                      isSelected ? "btn-primary" : "btn-ghost"
                    } ${isDisabled ? "btn-disabled opacity-30" : ""}`}
                  >
                    {monthAbbr(displayedYear, m, i18n.language)}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
