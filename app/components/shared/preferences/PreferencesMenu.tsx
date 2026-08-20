import type { ComponentType } from "react";
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
import { SettingsGroup } from "@/components/shared/SettingsGroup";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLanguageSwitch } from "@/lib/use-language-switch";
import { useThemeStore, type Theme } from "@/store/use-theme-store";

const THEME_OPTIONS: readonly [Theme, Theme] = ["light", "dark"];

function LanguageToggle() {
  const { t } = useTranslation();
  const { current, labels, switchTo, isSwitching } = useLanguageSwitch();

  return (
    <ToggleSwitch
      value={current}
      options={SUPPORTED_LANGUAGES}
      labels={labels}
      forceLtrOrder
      onChange={(next) => void switchTo(next)}
      aria-label={t("settings.language")}
      loading={isSwitching}
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

function PreferenceField({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
        <Icon className="size-3.5" />
        {label}
      </span>
      {children}
    </label>
  );
}

/** Inline settings section on the profile page — not a popover, so every preference stays visible at once. */
export function PreferencesMenu() {
  const { t } = useTranslation();

  return (
    <div className="animate-entry flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
          <Settings2 className="size-4.5" />
        </span>
        <h2 className="card-title flex-1 text-base">
          {t("common.sections.preferences.title")}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SettingsGroup title={t("common.sections.preferences.groups.display")}>
          <PreferenceField icon={Globe} label={t("settings.language")}>
            <LanguageToggle />
          </PreferenceField>
          <PreferenceField icon={Sun} label={t("settings.theme.label")}>
            <ThemeSwitch />
          </PreferenceField>
        </SettingsGroup>

        <SettingsGroup title={t("common.sections.preferences.groups.dateTime")}>
          <PreferenceField icon={Clock} label={t("settings.timeFormat.label")}>
            <TimeFormatSwitcher />
          </PreferenceField>
          <PreferenceField icon={CalendarDays} label={t("settings.dateFormat.label")}>
            <DateFormatSwitcher />
          </PreferenceField>
        </SettingsGroup>

        <SettingsGroup title={t("common.sections.preferences.groups.numbers")}>
          <PreferenceField icon={Hash} label={t("settings.numberFormat.label")}>
            <NumberFormatSwitcher />
          </PreferenceField>
          <PreferenceField icon={Minimize2} label={t("settings.compactNumbers.label")}>
            <CompactNumbersSwitcher />
          </PreferenceField>
        </SettingsGroup>
      </div>
    </div>
  );
}
