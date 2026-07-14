import { Contrast } from "lucide-react";
import { useTranslation } from "react-i18next";

export function HighContrastToggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <label className="border-base-300 bg-base-200/50 mt-3 flex cursor-pointer items-center justify-between rounded-lg border p-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Contrast data-no-flip className="size-4" />
        {t("settings.accessibility.highContrast")}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="toggle toggle-primary"
        aria-label={t("settings.accessibility.highContrast")}
      />
    </label>
  );
}
