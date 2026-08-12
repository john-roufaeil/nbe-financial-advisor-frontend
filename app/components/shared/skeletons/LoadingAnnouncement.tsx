import { useTranslation } from "react-i18next";

/** Announces loading state to screen readers, since the skeleton shapes next to it are aria-hidden. */
export function LoadingAnnouncement() {
  const { t } = useTranslation();
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {t("common.loading")}
    </span>
  );
}
