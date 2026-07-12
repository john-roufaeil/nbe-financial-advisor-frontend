import { Outlet, useParams, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ChatThreadList } from "@/components/chat/ChatThreadList";
import { useAppChatRuntime } from "@/lib/use-chat-runtime";
import { useDrawerStore } from "@/store/use-drawer-store";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { useSidebarResize } from "@/lib/use-sidebar-resize";
import { useMe } from "@/queries/profile";
import { ConfirmDialog } from "@/components/shared/modals/ConfirmDialog";
import { Tooltip } from "@/components/shared/Tooltip";
import { Z_DROPDOWN } from "@/lib/z-index";
import { useLayoutTier } from "@/lib/use-layout-tier";
import { SidebarHeader } from "@/components/shared/layout/SidebarHeader";
import { SidebarNav } from "@/components/shared/layout/SidebarNav";
import { SidebarFooter } from "@/components/shared/layout/SidebarFooter";

export default function AppLayout() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { isOpen, toggle, close } = useDrawerStore();
  const runtime = useAppChatRuntime();
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
            className={`responsive-sidebar border-base-300 bg-base-200 relative flex h-screen w-72 flex-col overflow-visible border-e ${
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
    </AssistantRuntimeProvider>
  );
}
