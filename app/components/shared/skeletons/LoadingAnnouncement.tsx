import { useTranslation } from "react-i18next";

/**
 * Visually-hidden text announcing "Loading…" to screen readers. The pulsing
 * skeleton shapes it accompanies are `aria-hidden` (they're layout mimicry,
 * not content), so without this a screen reader user gets silence, then
 * content just appears with no indication a load happened.
 */
export function LoadingAnnouncement() {
  const { t } = useTranslation();
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {t("common.loading")}
    </span>
  );
}
