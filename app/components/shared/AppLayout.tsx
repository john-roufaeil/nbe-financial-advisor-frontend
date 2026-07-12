import { NavLink, Outlet, useParams, useLocation, Link } from "react-router";
import { LayoutDashboard, Bot, ArrowLeftRight, FileText, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ChatThreadList } from "@/components/chat/ChatThreadList";
import { useAppChatRuntime } from "@/lib/use-chat-runtime";
import { useDrawerStore } from "@/store/use-drawer-store";
import { useMe } from "@/queries/profile";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { BalanceVisibilityToggle } from "@/components/shared/BalanceVisibilityToggle";
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

  const navItems = [
    { to: `/${lang}/dashboard`, label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: `/${lang}/chat`, label: t("nav.chat"), icon: Bot },
    { to: `/${lang}/transactions`, label: t("data.transactions"), icon: ArrowLeftRight },
    { to: `/${lang}/documents`, label: t("data.documents"), icon: FileText },
  ];

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary text-primary-content"
        : "text-base-content/80 hover:bg-base-300"
    }`;

  const onChat = location.pathname.startsWith(`/${lang}/chat`);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
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
          <aside className="border-base-300 bg-base-200 flex h-screen w-72 flex-col border-e">
            <div className="border-base-300 relative flex min-h-16 shrink-0 items-center border-b px-4">
              <Tooltip
                content={t("nav.menu")}
                position="end"
                className="absolute inset-y-0 inset-s-2 my-auto lg:hidden"
              >
                <button
                  className="btn btn-square btn-ghost"
                  onClick={close}
                  aria-label={t("nav.menu")}
                >
                  <X className="size-5" />
                </button>
              </Tooltip>
              <Tooltip
                content={t("nav.dashboard")}
                position="bottom"
                className="mx-auto w-1/2"
              >
                <Link
                  to={`/${lang}/dashboard`}
                  onClick={close}
                  className="w-full"
                  aria-label={t("nav.dashboard")}
                >
                  <img
                    src="/logo.webp"
                    alt={t("app.name")}
                    className="h-auto w-full max-w-50"
                  />
                </Link>
              </Tooltip>
            </div>

            <nav className="flex flex-col gap-2 p-3">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={close}
                  end={to.endsWith("/dashboard")}
                  className={navLinkClassName}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="min-w-0 wrap-break-word">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Chat threads live inside the same sidebar but on a distinct base-100 panel */}
            {onChat ? (
              <div className="border-base-300 bg-base-100 m-2 mt-1 flex min-h-0 flex-1 flex-col rounded-xl border p-2 shadow-sm">
                <ChatThreadList />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex shrink-0 flex-col gap-4 p-4">
              <div className="flex w-full items-center gap-2">
                <div className="flex w-full flex-col gap-2">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <DataSourceToggle />
                    <LanguageSwitcher onSelect={close} />
                  </div>
                </div>
              </div>
              <div className="border-base-300 flex w-full items-center gap-2 border-t pt-2">
                <NavLink
                  to={`/${lang}/profile`}
                  onClick={close}
                  className={({ isActive }) =>
                    `flex w-full min-w-0 items-center gap-3 rounded-md p-2 transition-colors ${
                      isActive ? "bg-base-300" : "hover:bg-base-300"
                    }`
                  }
                >
                  <span className="bg-primary text-primary-content grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="truncate text-sm font-semibold" title={fullName}>
                      {fullName}
                    </p>
                    <p className="text-base-content/50 truncate text-xs">
                      {t("nav.viewProfile")}
                    </p>
                  </div>
                </NavLink>
                <BalanceVisibilityToggle className="btn-square shrink-0" />
              </div>
            </div>
          </aside>
        </div>
      </div>
      <ConfirmDialog />
    </AssistantRuntimeProvider>
  );
}
