import { useTranslation } from "react-i18next";

/** Small asterisk marking a required field label, with an accessible label for screen readers. */
export function RequiredMark() {
  const { t } = useTranslation();
  return (
    <span className="text-error ms-0.5" aria-label={t("onboarding.required")}>
      *
    </span>
  );
}
