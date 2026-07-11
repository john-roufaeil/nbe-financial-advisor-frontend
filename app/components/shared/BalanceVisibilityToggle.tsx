import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { useBalanceVisibilityStore } from "@/store/use-balance-visibility-store";

/** The eye icon that shows/blurs every <Money> figure across the app — one shared toggle, one shared store. */
export function BalanceVisibilityToggle({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const hidden = useBalanceVisibilityStore((s) => s.hidden);
  const toggle = useBalanceVisibilityStore((s) => s.toggle);
  const label = hidden ? t("dashboard.showBalances") : t("dashboard.hideBalances");

  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={toggle}
        className={`bg-base-200 btn btn-ghost btn-sm btn-square ${className}`}
        aria-label={label}
      >
        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </Tooltip>
  );
}
