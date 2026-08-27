import { Outlet, useParams, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ChatThreadList } from "@/components/chat/ChatThreadList";
import { useAppChatRuntime } from "@/lib/use-chat-runtime";
import { useEventStream } from "@/lib/use-event-stream";
import { useSilentSessionRefresh } from "@/lib/use-silent-token-refresh";
import { useDrawerStore } from "@/store/use-drawer-store";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { useSidebarResize } from "@/lib/use-sidebar-resize";
import { useSyncPreferencesFromServer } from "@/lib/use-sync-preferences";
import { useMe } from "@/queries/profile";
import { ConfirmDialog } from "@/components/shared/modals/ConfirmDialog";
import { NotificationsModal } from "@/components/shared/modals/NotificationsModal";
import { CompleteProfileModal } from "@/components/profile/CompleteProfileModal";
import { Tooltip } from "@/components/shared/Tooltip";
import { Z_DROPDOWN } from "@/lib/z-index";
import { useLayoutTier } from "@/lib/use-layout-tier";
import { SidebarHeader } from "@/components/shared/layout/SidebarHeader";
import { SidebarNav } from "@/components/shared/layout/SidebarNav";
import { SidebarFooter } from "@/components/shared/layout/SidebarFooter";
import { SkipLinks } from "@/components/shared/layout/SkipLinks";

export default function AppLayout() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { isOpen, toggle, close } = useDrawerStore();
  const onChat = location.pathname.startsWith(`/${lang}/chat`);
  const runtime = useAppChatRuntime(onChat);
  useSilentSessionRefresh();
  // One multiplexed SSE connection for the whole app (statement, chat, and
  // bank-sync events) — lives here rather than per-route so it survives
  // navigation, same reasoning as useAppChatRuntime above.
  useEventStream();
  useSyncPreferencesFromServer();
  const { data: user } = useMe();
  const fullName = user?.name || "Profile";
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "?";

  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);
  const { sidebarWidth, isDragging, startResizing } = useSidebarResize();

  // Font-scale-aware layout tier (see useLayoutTier): "mobile" forces the
  // off-canvas drawer even on a wide screen once the user's in-app font
  // scale crosses 160%. At 140%+ ("laptop" tier) the sidebar stays exactly
  // as the user last set it — it no longer auto-collapses.
  const tier = useLayoutTier();
  const isForcedMobile = tier === "mobile";
  // Forced-mobile has no collapse toggle to un-collapse it with, so a stale
  // manual collapse from a prior desktop session must never carry over here.
  const effectiveCollapsed = !isForcedMobile && isCollapsed;

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
          {/* Part of this column (not a page-wide bar) so revealing it pushes
              only the content here down — the sidebar in drawer-side is a
              separate grid cell and stays exactly where it is. */}
          <SkipLinks
            links={[
              { href: "#main-content", label: t("nav.skipToMainContent") },
              { href: "#main-navigation", label: t("nav.skipToNavigation") },
            ]}
          />

          {/* Mobile top bar — an actual header row (own height + background)
              rather than a button floating over the page content, so it no
              longer overlaps whatever's at the top of the page. The logo
              sits next to the hamburger so the bar isn't mostly blank
              space. */}
          <div
            className={`border-base-300 bg-base-100 flex h-14 shrink-0 items-center gap-3 border-b px-3 ${isForcedMobile ? "" : "lg:hidden"}`}
          >
            <Tooltip content={t("nav.menu")} position="bottom">
              <button
                className="btn btn-square btn-ghost btn-sm"
                onClick={toggle}
                aria-label={t("nav.menu")}
              >
                <Menu className="size-5" />
              </button>
            </Tooltip>
            <img
              src="/logo-collapsed.webp"
              alt={t("app.name")}
              className="size-7 object-contain"
            />
            <span className="text-base-content truncate font-semibold">
              {t("app.name")}
            </span>
          </div>

          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-3 focus:outline-none"
          >
            <Outlet />
          </main>
        </div>

        {/* Navigation sidebar — base-200 */}
        <div className={`drawer-side ${Z_DROPDOWN}`}>
          <label htmlFor="app-drawer" className="drawer-overlay" onClick={close} />

          <aside
            id="main-navigation"
            tabIndex={-1}
            className={`responsive-sidebar border-base-300 bg-base-200 focus:outline-primary/50 relative flex h-screen w-72 flex-col overflow-visible border-e focus:outline-2 focus:outline-offset-2 ${
              isDragging ? "duration-0!" : "transition-[width] duration-300 ease-in-out"
            }`}
          >
            {/* Inner scrollable container so absolute drag-handle doesn't break */}
            <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto">
              <SidebarHeader
                lang={lang}
                isForcedMobile={isForcedMobile}
                effectiveCollapsed={effectiveCollapsed}
                onCloseDrawer={close}
                onToggleCollapse={toggleCollapse}
              />

              <SidebarNav
                lang={lang}
                effectiveCollapsed={effectiveCollapsed}
                onNavigate={close}
              />

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

              <SidebarFooter
                lang={lang}
                effectiveCollapsed={effectiveCollapsed}
                fullName={fullName}
                initial={initial}
                onNavigate={close}
              />
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
      <NotificationsModal />
      <CompleteProfileModal />
    </AssistantRuntimeProvider>
  );
}
