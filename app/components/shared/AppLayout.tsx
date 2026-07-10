import { NavLink, Outlet, useParams, useLocation, Link } from "react-router";
import {
  LayoutDashboard,
  Bot,
  ArrowLeftRight,
  FileText,
  Menu,
  X,
  Database,
  Cloud,
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
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { useDataSourceStore } from "@/store/use-data-source-store";

const DATA_SOURCE_OPTIONS = ["mock", "backend"] as const;

function DataSourceToggle() {
  const { t } = useTranslation();
  const source = useDataSourceStore((s) => s.source);
  const setSource = useDataSourceStore((s) => s.setSource);

  return (
    <ToggleSwitch
      value={source}
      options={DATA_SOURCE_OPTIONS}
      labels={{
        mock: t("dashboard.dataSource.mock"),
        backend: t("dashboard.dataSource.backend"),
      }}
      icons={{ mock: Database, backend: Cloud }}
      onChange={setSource}
      aria-label={t("dashboard.dataSource.mock")}
    />
  );
}

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
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
            <button
              className="btn btn-square btn-ghost"
              onClick={toggle}
              aria-label={t("nav.menu")}
            >
              <Menu className="size-5" />
            </button>
            <Link
              to={`/${lang}/dashboard`}
              onClick={close}
              className="mx-auto w-1/2 px-2 sm:w-1/3"
              aria-label={t("nav.dashboard")}
            >
              <img src="/logo.webp" alt={t("app.name")} className="h-auto w-full" />
            </Link>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto pt-3">
            <Outlet />
          </main>
        </div>

        {/* Navigation sidebar — base-200 */}
        <div className="drawer-side z-20">
          <label htmlFor="app-drawer" className="drawer-overlay" onClick={close} />
          <aside className="border-base-300 bg-base-200 flex h-screen w-72 flex-col border-e">
            <div className="border-base-300 relative flex h-16 shrink-0 items-center border-b px-4">
              <button
                className="btn btn-square btn-ghost absolute inset-y-0 inset-s-2 my-auto lg:hidden"
                onClick={close}
                aria-label={t("nav.menu")}
              >
                <X className="size-5" />
              </button>
              <Link
                to={`/${lang}/dashboard`}
                onClick={close}
                className="mx-auto w-1/2"
                aria-label={t("nav.dashboard")}
              >
                <img src="/logo.webp" alt={t("app.name")} className="h-auto w-full" />
              </Link>
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
                  <span className="truncate">{label}</span>
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

            <div className="border-base-300 flex shrink-0 flex-col gap-4 border-t p-4">
              <div className="flex w-full items-center gap-2">
                <div className="flex w-full flex-col gap-2">
                  <DataSourceToggle />
                  <div className="flex min-w-0 flex-1 gap-2">
                    <LanguageSwitcher onSelect={close} />
                    <BalanceVisibilityToggle className="btn-square" />
                  </div>
                </div>
              </div>
              <NavLink
                to={`/${lang}/profile`}
                onClick={close}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-lg p-2 transition-colors ${
                    isActive ? "bg-base-300" : "hover:bg-base-300"
                  }`
                }
              >
                <span className="bg-primary text-primary-content grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
                  {initial}
                </span>
                <div className="min-w-0 flex-1 text-start">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                  <p className="text-base-content/50 truncate text-xs">
                    {t("nav.viewProfile")}
                  </p>
                </div>
              </NavLink>
            </div>
          </aside>
        </div>
      </div>
      <ConfirmDialog />
    </AssistantRuntimeProvider>
  );
}
