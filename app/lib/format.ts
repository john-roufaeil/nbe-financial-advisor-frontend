import type {
  TimeFormat,
  DateFormat,
  NumberFormat,
} from "@/store/use-display-preferences-store";
import { BYTES_PER_KB } from "@/lib/constants/limits";

/**
 * Manual dd/mm/yyyy or mm/dd/yyyy formatting (no Intl/locale) so server and
 * client render identical strings regardless of each environment's own
 * timezone/locale settings, and so the format stays consistent regardless of
 * app language. `format` defaults to "dmy" for callers that predate the
 * date-format preference (see useDateFormatStore).
 */
export function formatDate(iso: string, format: DateFormat = "dmy") {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return format === "mdy" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

/**
 * Renders `date`'s time as either a 12-hour clock with localized am/pm or a
 * 24-hour clock, per the user's stored preference (see useTimeFormatStore).
 */
export function formatTime(date: Date, format: TimeFormat, t: (key: string) => string) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  if (format === "24h") {
    return `${hours24.toString().padStart(2, "0")}:${minutes}`;
  }
  const period = t(hours24 < 12 ? "app.am" : "app.pm");
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

/**
 * A literal 00:00 means "no time recorded" rather than an actual midnight
 * timestamp (the backend has no time component for these dates), so it's
 * hidden and the date is shown alone.
 */
export function formatDateTime(
  iso: string,
  timeFormat: TimeFormat,
  t: (key: string) => string,
  dateFormat: DateFormat = "dmy",
) {
  const d = new Date(iso);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  if (hours === 0 && minutes === 0) return formatDate(iso, dateFormat);
  return `${formatDate(iso, dateFormat)} · ${formatTime(d, timeFormat, t)}`;
}

export function formatSize(kb: number, t: (key: string) => string) {
  return kb >= BYTES_PER_KB
    ? `${(kb / BYTES_PER_KB).toFixed(1)} ${t("units.mb")}`
    : `${kb} ${t("units.kb")}`;
}

/**
 * Formats a number for display per the user's number-format preference (see
 * useNumberFormatStore: "comma" → 1,234.56, "period" → 1.234,56) and,
 * optionally, the compact-numbers preference (see useCompactNumbersStore:
 * 1,234,000 → "1.2M"). Display-only — inputs keep using formatMoney/
 * parseMoneyInput, whose fixed "," grouping and "." decimal are load-bearing
 * for round-tripping through Number() while typing.
 */
export function formatNumber(
  value: number,
  options: { separator?: NumberFormat; compact?: boolean } = {},
): string {
  const { separator = "comma", compact = false } = options;
  if (!Number.isFinite(value)) return "0";
  const decimalSep = separator === "period" ? "," : ".";
  const thousandsSep = separator === "period" ? "." : ",";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (compact && abs >= 1000) {
    const units: readonly [number, string][] = [
      [1_000_000_000, "B"],
      [1_000_000, "M"],
      [1_000, "K"],
    ];
    const [unitValue, suffix] = units.find(([v]) => abs >= v)!;
    const scaled = Math.round((abs / unitValue) * 10) / 10;
    const scaledStr = Number.isInteger(scaled)
      ? scaled.toString()
      : scaled.toFixed(1).replace(".", decimalSep);
    return `${sign}${scaledStr}${suffix}`;
  }

  const [wholePart, decimalPart] = abs.toFixed(2).split(".");
  const grouped = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  const trimmedDecimal = decimalPart === "00" ? "" : `${decimalSep}${decimalPart}`;
  return `${sign}${grouped}${trimmedDecimal}`;
}

/** Upper bound applied to money inputs that don't already define their own
 * (smaller, domain-specific) max, e.g. GoalsEditModal's TARGET_MAX. */
export const MAX_MONEY_VALUE = 1_000_000_000;

/**
 * Comma-groups a number's integer part (manual, no Intl/locale — same
 * reasoning as formatDate: keeps server/client output identical regardless
 * of each environment's own locale, and keeps the separator "," everywhere
 * instead of flipping per app language). Preserves up to 2 decimal places
 * when present, without padding whole numbers with ".00".
 */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const [wholePart, decimalPart] = Math.abs(value).toFixed(2).split(".");
  const grouped = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedDecimal = decimalPart === "00" ? "" : `.${decimalPart}`;
  const sign = value < 0 ? "-" : "";
  return `${sign}${grouped}${trimmedDecimal}`;
}

/**
 * Strips a comma-grouped money string back down to a plain digit/decimal
 * string suitable for Number()/storage — used as the onChange handler for
 * comma-formatted-while-typing money inputs. Keeps at most one "." and up to
 * 2 digits after it so partial typing (e.g. trailing ".") still round-trips.
 */
export function parseMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  const whole = cleaned.slice(0, firstDot);
  const decimal = cleaned
    .slice(firstDot + 1)
    .replace(/\./g, "")
    .slice(0, 2);
  return `${whole}.${decimal}`;
}
