import { Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccounts } from "@/queries/accounts";
import { Tooltip } from "@/components/shared/Tooltip";

/** Quick count of linked accounts — not shown anywhere else on the dashboard
 * (the full list only lives on the Accounts page). Reuses the same
 * useAccounts() query other dashboard cards already fetch, so this is free. */
export function AccountsSummaryCard() {
  const { t } = useTranslation();
  const { data: accounts } = useAccounts();
  if (!accounts || accounts.length === 0) return null;
  const active = accounts.filter((a) => a.is_active).length;

  return (
    <Tooltip content={t("dashboard.accountsSummary.tooltip")} className="w-full">
      <div className="card border-base-300 bg-base-100 animate-entry h-full w-full border shadow-sm">
        <div className="flex items-center gap-2 p-3">
          <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
            <Landmark data-no-flip className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base-content/60 truncate text-xs">
              {t("dashboard.accountsSummary.label")}
            </p>
            <p className="text-base font-semibold tabular-nums">{active}</p>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}
