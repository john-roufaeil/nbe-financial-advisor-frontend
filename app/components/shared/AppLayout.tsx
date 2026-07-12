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
  const [sidebarWidth, setSidebarWidth] = useState(288); // 288px = w-72 (Tailwind default)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (dragEvent: MouseEvent) => {
      const isRtl = document.dir === "rtl" || document.documentElement.dir === "rtl";
      const delta = dragEvent.clientX - startX;
      // Reverse drag math if document is Right-to-Left
      const newWidth = isRtl ? startWidth - delta : startWidth + delta;

      if (newWidth >= 200 && newWidth <= 550) {
        setSidebarWidth(newWidth);
        if (isCollapsed) setIsCollapsed(false);
      }
    };

    const stopDrag = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const navItems = [
    { to: `/${lang}/dashboard`, label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: `/${lang}/chat`, label: t("nav.chat"), icon: Bot },
    { to: `/${lang}/transactions`, label: t("data.transactions"), icon: ArrowLeftRight },
    { to: `/${lang}/bank-statements`, label: t("data.bankStatements"), icon: FileText },
  ];

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center rounded-md py-2.5 text-sm font-medium transition-colors ${
      isCollapsed ? "lg:justify-center px-3 gap-3 lg:gap-0" : "gap-3 px-3"
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
            width: ${isCollapsed ? 84 : sidebarWidth}px !important;
          }
        }
      `}</style>

      <div className="drawer lg:drawer-open">
        <input
          id="app-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isOpen}
          onChange={(e) => (e.target.checked ? undefined : close())}
        />

        {/* Main content surface — base-100 */}
        <div className="drawer-content bg-base-100 flex h-screen min-w-0 flex-col">
          <header className="navbar border-base-300 bg-base-200 min-h-14 shrink-0 border-b px-2 lg:hidden">
            <Tooltip content={t("nav.menu")} position="bottom">
              <button
                className="btn btn-square btn-ghost"
                onClick={toggle}
                aria-label={t("nav.menu")}
              >
                <Menu className="size-5" />
              </button>
            </Tooltip>
            <Tooltip
              content={t("nav.dashboard")}
              position="bottom"
              className="mx-auto w-1/2 sm:w-1/3"
            >
              <Link
                to={`/${lang}/dashboard`}
                onClick={close}
                className="w-full px-2"
                aria-label={t("nav.dashboard")}
              >
                <img
                  src="/logo.webp"
                  alt={t("app.name")}
                  className="h-auto w-full max-w-40"
                />
              </Link>
            </Tooltip>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto pt-3">
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
              <div className="border-base-300 relative flex min-h-16 shrink-0 items-center border-b px-4">
                {/* Mobile Menu Close Button — centered vertically using flex + absolute positioning */}
                <Tooltip
                  content={t("nav.menu")}
                  position="end"
                  className="absolute inset-y-0 start-2 my-auto flex items-center lg:hidden"
                >
                  <button
                    className="btn btn-square btn-ghost btn-sm"
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
                  className={isCollapsed ? "mx-auto" : "mx-auto w-1/2 lg:w-auto"}
                >
                  <Link
                    to={`/${lang}/dashboard`}
                    onClick={close}
                    className="flex w-full items-center justify-center"
                    aria-label={t("nav.dashboard")}
                  >
                    {/* Condensed View Logo (Desktop Only) */}
                    <img
                      src="/favicon.ico"
                      alt={t("app.name")}
                      className={`hidden size-8 object-contain ${isCollapsed ? "lg:block" : ""}`}
                    />
                    {/* Standard View Logo (Mobile & Desktop Expanded) */}
                    <img
                      src="/logo.webp"
                      alt={t("app.name")}
                      className={`h-auto w-full max-w-50 ${isCollapsed ? "lg:hidden" : ""}`}
                    />
                  </Link>
                </Tooltip>

                {/* Collapse/Expand Toggle (Desktop Only) */}
                <button
                  className="btn btn-square btn-ghost btn-sm hidden shrink-0 lg:flex"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label="Toggle Sidebar"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="size-5" />
                  ) : (
                    <PanelLeftClose className="size-5" />
                  )}
                </button>
              </div>

              <nav className="flex flex-col gap-2 p-3">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <Tooltip
                    key={to}
                    content={isCollapsed ? label : ""}
                    position="end"
                    className="w-full"
                    disabled={!isCollapsed}
                  >
                    <NavLink
                      to={to}
                      onClick={close}
                      end={to.endsWith("/dashboard")}
                      className={navLinkClassName}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span
                        className={`min-w-0 wrap-break-word ${isCollapsed ? "lg:hidden" : ""}`}
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
                  className={`border-base-300 bg-base-100 m-2 mt-1 flex min-h-32 flex-1 flex-col rounded-xl border p-2 shadow-sm ${isCollapsed ? "lg:hidden" : ""}`}
                >
                  <ChatThreadList />
                </div>
              ) : (
                <div className="flex-1" />
              )}
              {/* Ensure spacing remains when chat is collapsed */}
              {onChat && isCollapsed && <div className="hidden flex-1 lg:block" />}

              <div
                className={`flex shrink-0 p-4 ${isCollapsed ? "flex-col gap-1 lg:flex-col lg:items-center lg:gap-4" : "flex-col gap-1"}`}
              >
                <div
                  className={`flex min-w-0 items-center justify-between gap-2 ${isCollapsed ? "w-full lg:flex-col lg:justify-center" : "w-full"}`}
                >
                  <ThemeToggle className="shrink-0" />
                  <BalanceVisibilityToggle className="btn-square shrink-0" />
                </div>

                <div
                  className={`flex w-full items-center gap-2 ${isCollapsed ? "lg:hidden" : ""}`}
                >
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <DataSourceToggle />
                      <LanguageSwitcher onSelect={close} />
                    </div>
                  </div>
                </div>

                <div
                  className={`border-base-300 flex w-full items-center gap-2 border-t pt-2 ${isCollapsed ? "lg:justify-center" : ""}`}
                >
                  <NavLink
                    to={`/${lang}/profile`}
                    onClick={close}
                    className={({ isActive }) =>
                      `flex w-full min-w-0 items-center rounded-md transition-colors ${
                        isCollapsed ? "gap-3 p-2 lg:justify-center lg:p-1" : "gap-3 p-2"
                      } ${isActive ? "bg-base-300" : "hover:bg-base-300"}`
                    }
                  >
                    <span className="bg-primary text-primary-content grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
                      {initial}
                    </span>
                    <div
                      className={`min-w-0 flex-1 text-start ${isCollapsed ? "lg:hidden" : ""}`}
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

            {/* Drag Resize Handle (Desktop Only) */}
            <div
              className="hover:bg-primary absolute inset-y-0 -inset-e-0.75 z-50 hidden w-1.5 cursor-col-resize lg:block"
              onMouseDown={startResizing}
            />
          </aside>
        </div>
      </div>
      <ConfirmDialog />
    </AssistantRuntimeProvider>
  );
}
