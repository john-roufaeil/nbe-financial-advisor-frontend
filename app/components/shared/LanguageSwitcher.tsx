import { useParams, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/routes/lang-layout";

const LABELS: Record<SupportedLanguage, string> = { en: "EN", ar: "AR" };

export function LanguageSwitcher({ onSelect }: { onSelect?: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

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
    <div className="join w-full">
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          onClick={() => switchTo(code)}
          className={`btn btn-sm join-item flex-1 cursor-pointer ${code === lang ? "btn-primary" : "btn-outline"}`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
