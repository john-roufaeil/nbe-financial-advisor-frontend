import { useState } from "react";
import { NavLink, Outlet, useParams, useLocation, Link } from "react-router";
import {
  LayoutDashboard,
  Bot,
  ArrowLeftRight,
  FileText,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ChatThreadList } from "@/components/chat/ChatThreadList";
import { useAppChatRuntime } from "@/lib/use-chat-runtime";
import { useDrawerStore } from "@/store/use-drawer-store";
import { useMe } from "@/queries/profile";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { BalanceVisibilityToggle } from "@/components/shared/BalanceVisibilityToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { DataSourceToggle } from "@/components/shared/DataSourceToggle";
import { Tooltip } from "@/components/shared/Tooltip";
import { Z_DROPDOWN } from "@/lib/z-index";
import { useLayoutTier } from "@/lib/use-layout-tier";

export default function AppLayout() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { isOpen, toggle, close } = useDrawerStore();
  const runtime = useAppChatRuntime();
  const { data: user } = useMe();
  const fullName = user?.name || "Profile";
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "?";

  // State for desktop sidebar dragging & collapsing
  const MIN_SIDEBAR_WIDTH = 240;
  const MAX_SIDEBAR_WIDTH = 340;
  const [sidebarWidth, setSidebarWidth] = useState(MAX_SIDEBAR_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Font-scale-aware layout tier (see useLayoutTier): "mobile" forces the
  // off-canvas drawer even on a wide screen once the user's in-app font
  // scale crosses 160%. At 140%+ ("laptop" tier) the sidebar stays exactly
  // as the user last set it — it no longer auto-collapses.
  const tier = useLayoutTier();
  const isForcedMobile = tier === "mobile";
  // Forced-mobile has no collapse toggle to un-collapse it with, so a stale
  // manual collapse from a prior desktop session must never carry over here.
  const effectiveCollapsed = !isForcedMobile && isCollapsed;

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    // Prevent text-selection and show a consistent cursor over the whole page
    // while dragging, not just while the pointer is over the thin handle.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (dragEvent: MouseEvent) => {
      const isRtl = document.dir === "rtl" || document.documentElement.dir === "rtl";
      const delta = dragEvent.clientX - startX;
      // Reverse drag math if document is Right-to-Left
      const newWidth = isRtl ? startWidth - delta : startWidth + delta;
      const clampedWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, newWidth),
      );

      setSidebarWidth(clampedWidth);
      if (isCollapsed) setIsCollapsed(false);
    };

    const stopDrag = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const navItems = [
    { to: `/${lang}/dashboard`, label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: `/${lang}/chat`, label: t("nav.chat"), icon: Bot },
    { to: `/${lang}/transactions`, label: t("transactions.title"), icon: ArrowLeftRight },
    { to: `/${lang}/bank-statements`, label: t("bankStatements.title"), icon: FileText },
  ];

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center rounded-md py-2.5 text-sm font-medium transition-colors ${
      effectiveCollapsed ? "lg:justify-center px-3 gap-3 lg:gap-0" : "gap-3 px-3"
    } ${
      isActive
        ? "bg-primary text-primary-content"
        : "text-base-content/80 hover:bg-base-300"
    }`;

  const onChat = location.pathname.startsWith(`/${lang}/chat`);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Dynamic styles to handle desktop resizing while keeping mobile untouched */}
      <style>{`
        @media (min-width: 1024px) {
          .responsive-sidebar {
            width: ${effectiveCollapsed ? 84 : sidebarWidth}px !important;
          }
        }
      `}</style>

      {/* `lg:drawer-open` is a real (px) media query, which only tracks
          viewport width — it can't see the font-scale forcing above, so it's
          only applied when tier isn't already forced to "mobile" by scale. */}
      <div className={`drawer ${isForcedMobile ? "" : "lg:drawer-open"}`}>
        <input
          id="app-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isOpen}
          onChange={(e) => (e.target.checked ? undefined : close())}
        />

        {/* Main content surface — base-100 */}
        <div className="drawer-content bg-base-100 flex h-screen min-w-0 flex-col">
          {/* No bar chrome on mobile — just a floating hamburger button over
              the page content, so the header row's height/background/logo
              don't eat screen space on small viewports. */}
          <div
            className={`fixed inset-s-2 top-2 ${Z_DROPDOWN} ${isForcedMobile ? "" : "lg:hidden"}`}
          >
            <Tooltip content={t("nav.menu")} position="bottom">
              <button
                className="btn btn-square btn-ghost bg-base-200/80 shadow-sm backdrop-blur-sm"
                onClick={toggle}
                aria-label={t("nav.menu")}
              >
                <Menu className="size-5" />
              </button>
            </Tooltip>
          </div>

          <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-3">
            <Outlet />
          </main>
        </div>

        {/* Navigation sidebar — base-200 */}
        <div className={`drawer-side ${Z_DROPDOWN}`}>
          <label htmlFor="app-drawer" className="drawer-overlay" onClick={close} />

          <aside
            className={`responsive-sidebar border-base-300 bg-base-200 relative flex h-screen w-72 flex-col overflow-visible border-e ${
              isDragging ? "duration-0!" : "transition-[width] duration-300 ease-in-out"
            }`}
          >
            {/* Inner scrollable container so absolute drag-handle doesn't break */}
            <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto">
              <div
                className={`border-base-300 relative flex min-h-16 shrink-0 items-center border-b px-4 ${
                  effectiveCollapsed
                    ? "lg:min-h-24 lg:flex-col lg:justify-center lg:gap-2 lg:py-3"
                    : ""
                }`}
              >
                {/* Mobile Menu Close Button — fixed at the exact same viewport
                    position as the floating hamburger button above (same
                    `top-2 inset-s-2` + button classes), so the icon reads as
                    staying in place rather than jumping when the drawer opens. */}
                <Tooltip
                  content={t("nav.menu")}
                  position="end"
                  className={`fixed inset-s-2 top-2 ${Z_DROPDOWN} ${isForcedMobile ? "" : "lg:hidden"}`}
                >
                  <button
                    className="btn btn-square btn-ghost bg-base-200/80 shadow-sm backdrop-blur-sm"
                    onClick={close}
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
                    onClick={close}
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
                    onClick={() => setIsCollapsed(!isCollapsed)}
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
                      onClick={close}
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

              {/* Chat threads */}
              {onChat ? (
                <div
                  className={`border-base-300 bg-base-100 m-2 mt-1 flex min-h-32 flex-1 flex-col rounded-xl border p-2 shadow-sm ${effectiveCollapsed ? "lg:hidden" : ""}`}
                >
                  <ChatThreadList />
                </div>
              ) : (
                <div className="flex-1" />
              )}
              {/* Ensure spacing remains when chat is collapsed */}
              {onChat && effectiveCollapsed && <div className="hidden flex-1 lg:block" />}

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
                      <LanguageSwitcher onSelect={close} />
                    </div>
                  </div>
                </div>

                <div
                  className={`border-base-300 flex w-full items-center gap-2 border-t pt-2 ${effectiveCollapsed ? "lg:justify-center" : ""}`}
                >
                  <NavLink
                    to={`/${lang}/profile`}
                    onClick={close}
                    className={({ isActive }) =>
                      `flex w-full min-w-0 items-center rounded-md transition-colors ${
                        effectiveCollapsed
                          ? "gap-3 p-2 lg:justify-center lg:p-1"
                          : "gap-3 p-2"
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
            </div>

            {/* Drag Resize Handle (Desktop Only) — the clickable zone is wider
                than what's painted so it's easy to grab without pixel-precision,
                while the visible bar itself stays a thin, unobtrusive line that
                only lights up on hover/drag. */}
            <div
              className={`group absolute inset-y-0 -inset-e-1.5 z-50 hidden w-3 cursor-col-resize touch-none ${isForcedMobile ? "" : "lg:flex lg:items-center lg:justify-center"}`}
              onMouseDown={startResizing}
            >
              <div
                className={`h-full w-1 rounded-full transition-colors ${
                  isDragging ? "bg-primary" : "group-hover:bg-primary/50 bg-transparent"
                }`}
              />
            </div>
          </aside>
        </div>
      </div>
      <ConfirmDialog />
    </AssistantRuntimeProvider>
  );
}
