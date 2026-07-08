import { NavLink, Outlet, useNavigate, useParams, useLocation } from "react-router";
import { LayoutDashboard, MessageCircle, IdCard, Menu, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ChatThreadList } from "@/components/chat/ChatThreadList";
import { useAppChatRuntime } from "@/lib/use-chat-runtime";
import { useDrawerStore } from "@/store/use-drawer-store";
import { useAuthStore } from "@/store/use-auth-store";

export default function AppLayout() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isOpen, toggle, close } = useDrawerStore();
  const runtime = useAppChatRuntime();
  const logout = useAuthStore((s) => s.logout);

  const navItems = [
    { to: `/${lang}/dashboard`, label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: `/${lang}/chat`, label: t("nav.chat"), icon: MessageCircle },
    { to: `/${lang}/data`, label: t("nav.data"), icon: IdCard },
  ];

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
            <div className="border-base-300 flex h-16 shrink-0 items-center border-b px-4">
              <img src="/logo.webp" alt={t("app.name")} className="mx-auto h-9 w-auto" />
            </div>

            <nav className="flex flex-col gap-2 p-3">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={close}
                  end={to.endsWith("/dashboard")}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-content"
                        : "text-base-content/80 hover:bg-base-300"
                    }`
                  }
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

            <div className="border-base-300 flex shrink-0 flex-col gap-2 border-t p-3">
              <LanguageSwitcher onSelect={close} />
              <button
                className="btn btn-outline btn-error btn-sm w-full gap-2"
                onClick={() => {
                  close();
                  logout();
                  navigate(`/${lang}`);
                }}
              >
                <LogOut className="size-4" />
                {t("settings.signOut")}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
