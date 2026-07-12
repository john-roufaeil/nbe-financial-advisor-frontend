import { useParams, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Settings2,
  Clock,
  Globe,
  Moon,
  Sun,
  Hash,
  CalendarDays,
  Minimize2,
} from "lucide-react";
import { TimeFormatSwitcher } from "@/components/shared/preferences/TimeFormatSwitcher";
import { NumberFormatSwitcher } from "@/components/shared/preferences/NumberFormatSwitcher";
import { DateFormatSwitcher } from "@/components/shared/preferences/DateFormatSwitcher";
import { CompactNumbersSwitcher } from "@/components/shared/preferences/CompactNumbersSwitcher";
import { ToggleSwitch } from "@/components/shared/forms/ToggleSwitch";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { useThemeStore, type Theme } from "@/store/use-theme-store";
import { useToastStore } from "@/store/use-toast-store";

const THEME_OPTIONS: readonly [Theme, Theme] = ["light", "dark"];

function LanguageToggle() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const showToast = useToastStore((s) => s.show);

  const labels: Record<SupportedLanguage, string> = {
    en: t("settings.languageNames.en"),
    ar: t("settings.languageNames.ar"),
  };

  function switchTo(next: SupportedLanguage) {
    document.documentElement.lang = next;
    document.documentElement.dir = RTL_LANGUAGES.includes(next) ? "rtl" : "ltr";
    localStorage.setItem(STORAGE_KEYS.lang, next);
    void i18n.changeLanguage(next);
    showToast(t("toast.languageChanged", { language: labels[next] }), "info");
    if (next !== lang) {
      const rest = location.pathname.replace(`/${lang}`, "");
      navigate(`/${next}${rest}${location.search}`);
    }
  }

  return (
    <ToggleSwitch
      value={(lang as SupportedLanguage) ?? SUPPORTED_LANGUAGES[0]}
      options={SUPPORTED_LANGUAGES}
      labels={labels}
      forceLtrOrder
      onChange={switchTo}
      aria-label={t("settings.language")}
    />
  );
}

function ThemeSwitch() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const labels: Record<Theme, string> = {
    light: t("settings.theme.light"),
    dark: t("settings.theme.dark"),
  };

  return (
    <ToggleSwitch
      value={theme}
      options={THEME_OPTIONS}
      labels={labels}
      icons={{ light: Sun, dark: Moon }}
      forceLtrOrder
      onChange={setTheme}
      aria-label={t("settings.theme.label")}
    />
  );
}

/** Inline settings card on the profile page — not a popover, so every preference stays visible at once. */
export function PreferencesMenu() {
  const { t } = useTranslation();

  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Settings2 className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">
            {t("common.sections.preferences.title")}
          </h2>
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
              <Clock className="size-3.5" />
              {t("settings.timeFormat.label")}
            </span>
            <TimeFormatSwitcher />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
              <Globe className="size-3.5" />
              {t("settings.language")}
            </span>
            <LanguageToggle />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
              <Sun className="size-3.5" />
              {t("settings.theme.label")}
            </span>
            <ThemeSwitch />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
              <Hash className="size-3.5" />
              {t("settings.numberFormat.label")}
            </span>
            <NumberFormatSwitcher />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
              <CalendarDays className="size-3.5" />
              {t("settings.dateFormat.label")}
            </span>
            <DateFormatSwitcher />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
              <Minimize2 className="size-3.5" />
              {t("settings.compactNumbers.label")}
            </span>
            <CompactNumbersSwitcher />
          </label>
        </div>
      </div>
    </div>
  );
}
