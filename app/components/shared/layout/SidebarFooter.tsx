import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/shared/preferences/LanguageSwitcher";
import { BalanceVisibilityToggle } from "@/components/shared/preferences/BalanceVisibilityToggle";
import { ThemeToggle } from "@/components/shared/preferences/ThemeToggle";
import { DataSourceToggle } from "@/components/shared/preferences/DataSourceToggle";

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
        className={`border-base-300 flex w-full items-center gap-2 border-t pt-2 ${effectiveCollapsed ? "lg:justify-center" : ""}`}
      >
        <NavLink
          to={`/${lang}/profile`}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex w-full min-w-0 items-center rounded-md transition-colors ${
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
      </div>
    </div>
  );
}
