import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { LinkToggle } from "@/components/shared/forms/LinkToggle";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { useLanguageSwitch } from "@/lib/use-language-switch";

export function LanguageSwitcher({
  onSelect,
  variant,
  className,
  icons,
  showLabel,
}: {
  onSelect?: () => void;
  variant?: "link" | "btn-ghost";
  className?: string;
  icons?: Record<SupportedLanguage, ComponentType<{ className?: string }>>;
  /** When false, collapses to an icon-only button — see `LinkToggle`. */
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const { current, labels, switchTo, isSwitching } = useLanguageSwitch();

  return (
    <LinkToggle
      value={current}
      options={SUPPORTED_LANGUAGES}
      labels={labels}
      icons={icons}
      onChange={(next) => {
        onSelect?.();
        void switchTo(next);
      }}
      aria-label={t("settings.language")}
      variant={variant}
      className={className}
      loading={isSwitching}
      showLabel={showLabel}
    />
  );
}
