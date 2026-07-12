import { useParams, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/routes/lang-layout";
import { LinkToggle } from "@/components/shared/LinkToggle";
import { useToastStore } from "@/store/use-toast-store";

export function LanguageSwitcher({
  onSelect,
  variant,
  className,
}: {
  onSelect?: () => void;
  variant?: "link" | "btn-ghost";
  className?: string;
}) {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const showToast = useToastStore((s) => s.show);

  const labels: Record<SupportedLanguage, string> = {
    en: t("settings.languageNames.en"),
    ar: t("settings.languageNames.ar"),
  };

  function switchTo(next: SupportedLanguage) {
    onSelect?.();
    document.documentElement.lang = next;
    document.documentElement.dir = RTL_LANGUAGES.includes(next) ? "rtl" : "ltr";
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    void i18n.changeLanguage(next);
    showToast(t("toast.languageChanged", { language: labels[next] }), "info");
    if (next !== lang) {
      const rest = location.pathname.replace(`/${lang}`, "");
      navigate(`/${next}${rest}${location.search}`);
    }
  }

  return (
    <LinkToggle
      value={(lang as SupportedLanguage) ?? SUPPORTED_LANGUAGES[0]}
      options={SUPPORTED_LANGUAGES}
      labels={labels}
      onChange={switchTo}
      aria-label={t("settings.language")}
      variant={variant}
      className={className}
    />
  );
}
