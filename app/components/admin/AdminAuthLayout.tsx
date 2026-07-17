import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/shared/preferences/LanguageSwitcher";

/**
 * Deliberately NOT AuthLayout (the consumer sign-in/onboarding shell): that
 * component's whole job is the marketing hero panel ("Meet your AI financial
 * advisor") and matches the light, friendly consumer brand. Admin accounts are
 * a completely separate credential space server-side (core/views/administration.py's
 * AdminLoginView) with no relation to that experience, so the page is styled
 * to read as an internal tool — plain, unmistakably not the customer app —
 * rather than borrowing consumer branding for staff-only access.
 *
 * Uses daisyUI's `neutral` token (a dark, near-black tone in this theme) for
 * the backdrop instead of a literal color, so it still reads as "distinct
 * from base-100/200" even if the theme's palette changes later.
 */
export function AdminAuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="bg-neutral relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-e-4 top-4">
        <LanguageSwitcher
          variant="btn-ghost"
          className="btn-sm text-neutral-content hover:bg-neutral-content/10"
        />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="bg-neutral-content/10 text-neutral-content grid size-12 place-items-center rounded-full">
            <ShieldCheck data-no-flip className="size-6" />
          </span>
          <span className="text-neutral-content/60 text-xs font-medium tracking-widest uppercase">
            {t("admin.signIn.badge")}
          </span>
        </div>
        <div className="border-base-300 bg-base-100 rounded-xl border p-6 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
