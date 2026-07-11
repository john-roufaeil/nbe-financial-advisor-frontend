import type { TimeFormat } from "@/store/use-time-format-store";

/**
 * Manual dd/mm/yyyy formatting (no Intl/locale) so server and client render
 * identical strings regardless of each environment's own timezone/locale
 * settings, and so the format stays consistent regardless of app language.
 */
export function formatDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
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
  format: TimeFormat,
  t: (key: string) => string,
) {
  const d = new Date(iso);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  if (hours === 0 && minutes === 0) return formatDate(iso);
  return `${formatDate(iso)} · ${formatTime(d, format, t)}`;
}

export function formatSize(kb: number, t: (key: string) => string) {
  return kb >= 1024
    ? `${(kb / 1024).toFixed(1)} ${t("units.mb")}`
    : `${kb} ${t("units.kb")}`;
}
