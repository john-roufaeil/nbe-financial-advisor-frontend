import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  FolderTree,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { usePageTitle } from "@/lib/use-page-title";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { useAdminOverviewCounts, useAdminLogout } from "@/queries/admin";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import { ConfirmDialog } from "@/components/shared/modals/ConfirmDialog";
import { LanguageSwitcher } from "@/components/shared/preferences/LanguageSwitcher";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { ProductsPanel } from "@/components/admin/ProductsPanel";
import { IssuesPanel } from "@/components/admin/IssuesPanel";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { Z_DROPDOWN } from "@/lib/z-index";

const TABS = ["categories", "products", "issues", "feedback"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, typeof FolderTree> = {
  categories: FolderTree,
  products: Package,
  issues: TriangleAlert,
  feedback: MessageSquareText,
};

export default function AdminDashboard() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t("admin.dashboard.title"));
  const role = useAdminAuthStore((s) => s.role);
  const logout = useAdminAuthStore((s) => s.logout);
  const logoutMutation = useAdminLogout();
  const [tab, setTab] = useState<Tab>("categories");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const counts = useAdminOverviewCounts();

  // Category/product writes are super_admin-only server-side (403 otherwise);
  // hiding the buttons for reviewers just keeps the UI honest about it.
  const canWrite = role === "super_admin";

  // SEC-009: invalidates the refresh token server-side (POST
  // /admin/auth/logout) before dropping the local session — best-effort,
  // same as the end-user flow: local state clears regardless of whether the
  // request succeeds (offline, already expired, etc.).
  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Best-effort — local state still clears below.
    }
    logout();
    navigate(localizedPath(lang!, ROUTE_SEGMENTS.admin), { replace: true });
  }

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="admin-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        // Only ever acts on the "closing" direction (matches AppLayout's drawer):
        // opening is driven exclusively by the hamburger button below. If this
        // also reacted to `checked: true`, clicking the overlay would race with
        // the browser's own label→checkbox toggle-forwarding — our onClick
        // below closes it, then the native forwarding flips the checkbox back
        // open and fires this handler with `checked: true`, undoing the close.
        onChange={(e) => (e.target.checked ? undefined : setDrawerOpen(false))}
      />

      <div className="drawer-content bg-base-200 flex h-dvh flex-col">
        {/* Floating hamburger, mobile/tablet only — the sidebar is always
            visible from lg upward. */}
        <div className={`fixed inset-s-2 top-2 ${Z_DROPDOWN} lg:hidden`}>
          <button
            type="button"
            className="btn btn-square btn-ghost bg-base-100/80 shadow-sm backdrop-blur-sm"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.menu")}
          >
            <Menu className="size-5" />
          </button>
        </div>

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 pt-16 sm:px-6 lg:pt-6">
          <h2 className="text-xl font-semibold">{t(`admin.tabs.${tab}`)}</h2>
          {tab === "categories" && <CategoriesPanel canWrite={canWrite} />}
          {tab === "products" && <ProductsPanel canWrite={canWrite} />}
          {tab === "issues" && <IssuesPanel />}
          {tab === "feedback" && <FeedbackPanel />}
        </main>
      </div>

      <div className={`drawer-side ${Z_DROPDOWN}`}>
        <label
          htmlFor="admin-drawer"
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
        <aside className="border-base-300 bg-base-100 flex h-full w-60 shrink-0 flex-col border-e">
          <div className="border-base-300 flex items-center gap-2.5 border-b p-4">
            <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-full">
              <ShieldCheck data-no-flip className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate text-sm font-semibold">
                {t("admin.dashboard.title")}
              </h1>
              {role && (
                <span className="text-base-content/60 text-xs">
                  {t(`admin.roles.${role}`)}
                </span>
              )}
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {TABS.map((name) => {
              const Icon = TAB_ICONS[name];
              const count =
                name === "categories"
                  ? counts.categoriesCount
                  : name === "products"
                    ? counts.productsCount
                    : name === "issues"
                      ? counts.openIssuesCount
                      : name === "feedback"
                        ? counts.feedbackCount
                        : undefined;
              return (
                <button
                  key={name}
                  type="button"
                  aria-current={tab === name ? "page" : undefined}
                  onClick={() => {
                    setTab(name);
                    setDrawerOpen(false);
                  }}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors ${
                    tab === name
                      ? "bg-primary/10 text-primary"
                      : "text-base-content/70 hover:bg-base-200"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{t(`admin.tabs.${name}`)}</span>
                  {typeof count === "number" && (
                    <span
                      className={`badge badge-sm ${tab === name ? "badge-primary" : "badge-ghost"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1 p-3 pt-0">
            <LanguageSwitcher variant="btn-ghost" className="btn-sm w-full" />
            <button
              type="button"
              className="btn btn-ghost btn-sm cursor-pointer justify-start gap-2.5"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              {t("admin.dashboard.logout")}
            </button>
          </div>
        </aside>
      </div>
      <ConfirmDialog />
    </div>
  );
}
