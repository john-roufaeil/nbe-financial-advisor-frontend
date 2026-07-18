import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/preferences/LanguageSwitcher";
import { BalanceVisibilityToggle } from "@/components/shared/preferences/BalanceVisibilityToggle";
import { ThemeToggle } from "@/components/shared/preferences/ThemeToggle";
import { DataSourceToggle } from "@/components/shared/preferences/DataSourceToggle";
import { Tooltip } from "@/components/shared/Tooltip";
import { useNotificationsStore } from "@/store/use-notifications-store";
import { useNotificationsModalStore } from "@/store/use-notifications-modal-store";

export function SidebarFooter({
  lang,
  effectiveCollapsed,
  fullName,
  initial,
  onNavigate,
}: {
  lang: string | undefined;
  effectiveCollapsed: boolean;
  fullName: string;
  initial: string;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const unreadCount = useNotificationsStore(
    (s) => s.notifications.filter((n) => !n.read).length,
  );
  const openNotifications = useNotificationsModalStore((s) => s.open);

  return (
    <div
      className={`flex shrink-0 p-4 ${effectiveCollapsed ? "flex-col gap-1 lg:flex-col lg:items-center lg:gap-4" : "flex-col gap-1"}`}
    >
      <div
        className={`flex min-w-0 items-center justify-between gap-2 ${effectiveCollapsed ? "w-full lg:flex-col lg:justify-center" : "w-full"}`}
      >
        <ThemeToggle className="shrink-0" />
        <BalanceVisibilityToggle className="btn-square shrink-0" />
      </div>

      <div
        className={`flex w-full items-center gap-2 ${effectiveCollapsed ? "lg:hidden" : ""}`}
      >
        <div className="flex w-full flex-col gap-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <DataSourceToggle />
            <LanguageSwitcher onSelect={onNavigate} />
          </div>
        </div>
      </div>

      <div
        className={`border-base-300 flex w-full items-center gap-2 border-t pt-2 ${effectiveCollapsed ? "lg:flex-col" : ""}`}
      >
        <NavLink
          to={`/${lang}/profile`}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center rounded-md transition-colors ${
              effectiveCollapsed ? "gap-3 p-2 lg:justify-center lg:p-1" : "gap-3 p-2"
            } ${isActive ? "bg-base-300" : "hover:bg-base-300"}`
          }
        >
          <span className="bg-primary text-primary-content grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
            {initial}
          </span>
          <div
            className={`min-w-0 flex-1 text-start ${effectiveCollapsed ? "lg:hidden" : ""}`}
          >
            <p className="truncate text-sm font-semibold" title={fullName}>
              {fullName}
            </p>
            <p className="text-base-content/50 truncate text-xs">
              {t("nav.viewProfile")}
            </p>
          </div>
        </NavLink>

        <Tooltip content={t("nav.notifications")} position="start">
          <span className="relative inline-flex shrink-0">
            <button
              type="button"
              onClick={() => openNotifications()}
              aria-label={t("nav.notifications")}
              className="btn btn-ghost btn-circle btn-sm"
            >
              <Bell className="size-4.5" />
            </button>
            {unreadCount > 0 && (
              <span className="bg-error text-error-content pointer-events-none absolute -inset-e-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] leading-none font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
