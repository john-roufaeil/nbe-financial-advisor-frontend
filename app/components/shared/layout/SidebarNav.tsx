import { NavLink } from "react-router";
import { LayoutDashboard, Bot, ArrowLeftRight, FileText, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

export function SidebarNav({
  lang,
  effectiveCollapsed,
  onNavigate,
}: {
  lang: string | undefined;
  effectiveCollapsed: boolean;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();

  const navItems = [
    {
      to: localizedPath(lang!, ROUTE_SEGMENTS.dashboard),
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
    },
    { to: localizedPath(lang!, ROUTE_SEGMENTS.chat), label: t("nav.chat"), icon: Bot },
    {
      to: localizedPath(lang!, ROUTE_SEGMENTS.transactions),
      label: t("transactions.title"),
      icon: ArrowLeftRight,
    },
    {
      to: localizedPath(lang!, ROUTE_SEGMENTS.bankStatements),
      label: t("bankStatements.title"),
      icon: FileText,
    },
    {
      to: localizedPath(lang!, ROUTE_SEGMENTS.budget),
      label: t("budget.title"),
      icon: BarChart3,
    },
  ];

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center rounded-md py-2.5 text-sm font-medium transition-colors ${
      effectiveCollapsed ? "lg:justify-center px-3 gap-3 lg:gap-0" : "gap-3 px-3"
    } ${
      isActive
        ? "bg-primary text-primary-content"
        : "text-base-content/80 hover:bg-base-300"
    }`;

  return (
    <nav className="flex flex-col gap-2 p-3">
      {navItems.map(({ to, label, icon: Icon }) => (
        <Tooltip
          key={to}
          content={effectiveCollapsed ? label : ""}
          position="end"
          className="w-full"
          disabled={!effectiveCollapsed}
        >
          <NavLink
            to={to}
            onClick={onNavigate}
            end={to.endsWith("/dashboard")}
            className={navLinkClassName}
          >
            <Icon className="size-5 shrink-0" />
            {/* whitespace-nowrap + overflow-hidden (not wrap-break-word) so the
                label clips flat while the sidebar's own width is mid-transition
                instead of wrapping letter-by-letter into a vertical column at
                the narrower intermediate widths. */}
            <span
              className={`min-w-0 overflow-hidden text-nowrap ${effectiveCollapsed ? "lg:hidden" : ""}`}
            >
              {label}
            </span>
          </NavLink>
        </Tooltip>
      ))}
    </nav>
  );
}
