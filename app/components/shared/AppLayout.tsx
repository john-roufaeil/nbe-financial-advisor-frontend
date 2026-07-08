import { NavLink, Outlet, useParams, useLocation } from "react-router";
import { LayoutDashboard, Bot, ArrowLeftRight, FileText, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ChatThreadList } from "@/components/chat/ChatThreadList";
import { useAppChatRuntime } from "@/lib/use-chat-runtime";
import { useDrawerStore } from "@/store/use-drawer-store";
import { usePersonalDataStore } from "@/store/use-personal-data-store";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function AppLayout() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { isOpen, toggle, close } = useDrawerStore();
  const runtime = useAppChatRuntime();
  const fullName = usePersonalDataStore((s) => s.profile.fullName);
  const initial = fullName.trim().charAt(0).toUpperCase();

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
            <img
              src="/logo.webp"
              alt={t("app.name")}
              className="mx-auto h-8 w-auto px-2"
            />
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
                className="btn btn-square btn-ghost absolute inset-y-0 start-2 my-auto lg:hidden"
                onClick={close}
                aria-label={t("nav.menu")}
              >
                <X className="size-5" />
              </button>
              <img src="/logo.webp" alt={t("app.name")} className="mx-auto h-9 w-auto" />
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
              <LanguageSwitcher onSelect={close} />
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
