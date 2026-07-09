import { useParams, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/routes/lang-layout";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

const LABELS: Record<SupportedLanguage, string> = { en: "EN", ar: "عر" };

export function LanguageSwitcher({ onSelect }: { onSelect?: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  function switchTo(next: SupportedLanguage) {
    onSelect?.();
    document.documentElement.lang = next;
    document.documentElement.dir = RTL_LANGUAGES.includes(next) ? "rtl" : "ltr";
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    void i18n.changeLanguage(next);
    if (next !== lang) {
      const rest = location.pathname.replace(`/${lang}`, "");
      navigate(`/${next}${rest}${location.search}`);
    }
  }

  return (
    <ToggleSwitch
      value={(lang as SupportedLanguage) ?? SUPPORTED_LANGUAGES[0]}
      options={SUPPORTED_LANGUAGES}
      labels={LABELS}
      forceLtrOrder
      onChange={switchTo}
      aria-label={t("settings.language")}
    />
  );
}
