import { useTranslation } from "react-i18next";
import { LinkToggle } from "@/components/shared/forms/LinkToggle";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLanguageSwitch } from "@/lib/use-language-switch";

export function LanguageSwitcher({
  onSelect,
  variant,
  className,
}: {
  onSelect?: () => void;
  variant?: "link" | "btn-ghost";
  className?: string;
}) {
  const { t } = useTranslation();
  const { current, labels, switchTo, isSwitching } = useLanguageSwitch();

  return (
    <LinkToggle
      value={current}
      options={SUPPORTED_LANGUAGES}
      labels={labels}
      onChange={(next) => {
        onSelect?.();
        void switchTo(next);
      }}
      aria-label={t("settings.language")}
      variant={variant}
      className={className}
      loading={isSwitching}
    />
  );
}
