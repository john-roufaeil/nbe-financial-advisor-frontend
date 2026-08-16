import { Landmark, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DASHBOARD_PERIODS, type DashboardFilters } from "@/types/dashboard";
import type { BankAccount } from "@/types/account";
import { useAccounts } from "@/queries/accounts";
import { EntityPicker } from "@/components/shared/forms/EntityPicker";
import { useBankInfo } from "@/lib/banks";
import {
  DASHBOARD_CARDS,
  useDashboardPrefsStore,
} from "@/store/use-dashboard-prefs-store";

/** One row/trigger face of the account picker: bank logo + name + masked
 * number for a real account, a neutral landmark icon for "all accounts".
 * Its own component because bank info comes from a hook. */
function AccountOption({ account }: { account?: BankAccount }) {
  const { t } = useTranslation();
  const { label, logo } = useBankInfo(account?.bank_name);

  if (!account) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <Landmark className="text-base-content/50 size-4 shrink-0" />
        <span className="truncate">{t("dashboard.toolbar.allAccounts")}</span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <img src={logo} alt="" className="size-4.5 shrink-0 rounded-full object-cover" />
      <span className="truncate">{label ?? account.bank_name}</span>
      {/* Truncates rather than shrink-0: account numbers are full-length now,
          and a 16-digit one pinned at its natural width would push the bank
          name out of this toolbar chip on narrow viewports. */}
      <span className="text-base-content/40 min-w-0 truncate text-xs" dir="ltr">
        {account.account_number}
      </span>
    </span>
  );
}

/** Period + account filters that scope every card below, plus a Customize
 * menu to toggle which cards are shown. */
export function DashboardToolbar({
  filters,
  onFiltersChange,
}: {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}) {
  const { t } = useTranslation();
  const { data: accounts } = useAccounts();
  const hiddenCards = useDashboardPrefsStore((s) => s.hiddenCards);
  const toggleCard = useDashboardPrefsStore((s) => s.toggleCard);
  const showAllCards = useDashboardPrefsStore((s) => s.showAllCards);

  return (
    // animate-entry leaves a transform behind (fill-mode: both), turning this
    // row and every card below into sibling stacking contexts painted in DOM
    // order — which would draw the Customize dropdown UNDER the stat cards.
    // z-10 lifts the whole row above the card rows so the open menu wins.
    <div className="animate-entry relative z-10 flex flex-wrap items-center gap-2">
      <div
        className="join border-base-300 bg-base-100 rounded-lg border shadow-sm"
        role="group"
        aria-label={t("dashboard.toolbar.period")}
      >
        {DASHBOARD_PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            aria-pressed={filters.period === period}
            onClick={() => onFiltersChange({ ...filters, period })}
            className={`btn btn-sm join-item border-none font-medium ${
              filters.period === period ? "btn-primary" : "btn-ghost text-base-content/60"
            }`}
          >
            {t(`dashboard.toolbar.periods.${period}`)}
          </button>
        ))}
      </div>

      {(accounts?.length ?? 0) > 0 && (
        <EntityPicker
          className="w-64"
          triggerSize="sm"
          ariaLabel={t("dashboard.toolbar.account")}
          items={[undefined, ...(accounts ?? [])]}
          getKey={(account) => account?.id ?? ""}
          onSelect={(account) => onFiltersChange({ ...filters, accountId: account?.id })}
          trigger={
            <AccountOption account={accounts?.find((a) => a.id === filters.accountId)} />
          }
          renderItem={(account) => <AccountOption account={account} />}
          itemClassName={(account) =>
            (account?.id ?? undefined) === filters.accountId ? "bg-primary/10" : ""
          }
        />
      )}

      <div className="dropdown dropdown-end ms-auto">
        <button
          type="button"
          tabIndex={0}
          className="btn btn-sm btn-ghost border-base-300 bg-base-100 gap-2 border shadow-sm"
        >
          <SlidersHorizontal className="size-4" />
          {t("dashboard.toolbar.customize")}
          {hiddenCards.length > 0 && (
            <span className="badge badge-primary badge-xs">{hiddenCards.length}</span>
          )}
        </button>
        <ul className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-20 mt-1 w-52 border p-2 shadow-lg">
          {DASHBOARD_CARDS.map((card) => (
            <li key={card}>
              <button
                type="button"
                onClick={() => toggleCard(card)}
                className="flex w-full cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  tabIndex={-1}
                  className="checkbox checkbox-primary checkbox-xs pointer-events-none"
                  checked={!hiddenCards.includes(card)}
                  readOnly
                />
                <span className="text-sm">{t(`dashboard.toolbar.cards.${card}`)}</span>
              </button>
            </li>
          ))}
          <li className="divider my-1 h-0.5"></li>
          <li>
            <button
              type="button"
              onClick={showAllCards}
              disabled={hiddenCards.length === 0}
              className="text-sm"
            >
              <RotateCcw size={16} />
              {t("dashboard.toolbar.reset")}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
