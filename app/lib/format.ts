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

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${formatDate(iso)} · ${hours}:${minutes}`;
}
