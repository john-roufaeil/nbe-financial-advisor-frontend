import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { useThemeStore } from "@/store/use-theme-store";

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
  const Icon = theme === "dark" ? Sun : Moon;

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        className={`btn btn-ghost bg-base-200 justify-start gap-1.5 font-medium ${className}`}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={toggleTheme}
        className={`bg-base-200 btn btn-ghost btn-sm btn-square ${className}`}
        aria-label={label}
      >
        <Icon className="size-4" />
      </button>
    </Tooltip>
  );
}
