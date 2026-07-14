import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/store/use-theme-store";
import { IconToggleButton } from "@/components/shared/preferences/IconToggleButton";

/** Toggles the `dark` class on <html>, switching every base/primary/etc. color var in app.css. */
export function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string;
  /** Renders as a full-width labeled chip (matches LinkToggle's btn-ghost style) instead of an icon-only square button. */
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const label = theme === "dark" ? t("settings.theme.light") : t("settings.theme.dark");

  return (
    <IconToggleButton
      icon={theme === "dark" ? Sun : Moon}
      label={label}
      onClick={toggleTheme}
      className={className}
      showLabel={showLabel}
    />
  );
}
