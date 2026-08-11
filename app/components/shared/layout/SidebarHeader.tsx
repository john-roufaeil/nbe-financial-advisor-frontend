import { Link } from "react-router";
import { X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { Z_DROPDOWN } from "@/lib/z-index";

export function SidebarHeader({
  lang,
  isForcedMobile,
  effectiveCollapsed,
  onCloseDrawer,
  onToggleCollapse,
}: {
  lang: string | undefined;
  isForcedMobile: boolean;
  effectiveCollapsed: boolean;
  onCloseDrawer: () => void;
  onToggleCollapse: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`border-base-300 relative flex min-h-16 shrink-0 items-center border-b px-4 ${
        effectiveCollapsed
          ? "lg:min-h-24 lg:flex-col lg:justify-center lg:gap-2 lg:py-3"
          : ""
      }`}
    >
      {/* Mobile Menu Close Button — fixed at roughly the same spot the
          hamburger sits in AppLayout's mobile top bar (`top-3 inset-s-3`,
          `btn-sm`), so the icon reads as staying in place rather than
          jumping when the drawer opens. */}
      <Tooltip
        content={t("nav.menu")}
        position="end"
        className={`fixed inset-s-3 top-3 ${Z_DROPDOWN} ${isForcedMobile ? "" : "lg:hidden"}`}
      >
        <button
          className="btn btn-square btn-ghost btn-sm bg-base-200/80 shadow-sm backdrop-blur-sm"
          onClick={onCloseDrawer}
          aria-label={t("nav.menu")}
        >
          <X className="size-5" />
        </button>
      </Tooltip>

      {/* Logo Section */}
      <Tooltip
        content={t("nav.dashboard")}
        position="bottom"
        className={effectiveCollapsed ? "mx-auto" : "mx-auto w-1/2 lg:w-auto"}
      >
        <Link
          to={`/${lang}/dashboard`}
          onClick={onCloseDrawer}
          className="flex w-full items-center justify-center"
          aria-label={t("nav.dashboard")}
        >
          {/* Condensed View Logo (Desktop Only) */}
          <img
            src="/logo-collapsed.webp"
            alt={t("app.name")}
            className={`hidden size-8 object-contain ${effectiveCollapsed ? "lg:block" : ""}`}
          />
          {/* Standard View Logo (Mobile & Desktop Expanded) — fixed size, doesn't scale with sidebar width */}
          <img
            src="/logo.webp"
            alt={t("app.name")}
            className={`h-auto w-36 ${effectiveCollapsed ? "lg:hidden" : ""}`}
          />
        </Link>
      </Tooltip>

      {/* Collapse/Expand Toggle (Desktop Only) — stacks beneath the minimized
          logo when collapsed. Hidden once font-scale forces the mobile
          (off-canvas drawer, hamburger-openable) treatment — that layout has
          no persistent sidebar to collapse/expand in the first place. */}
      {!isForcedMobile && (
        <button
          className="btn btn-square btn-ghost btn-sm hidden shrink-0 lg:flex"
          onClick={onToggleCollapse}
          aria-label="Toggle Sidebar"
        >
          {effectiveCollapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>
      )}
    </div>
  );
}
