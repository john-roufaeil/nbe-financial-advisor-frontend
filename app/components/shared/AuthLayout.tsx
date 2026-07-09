import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

/**
 * Split-screen shell for the auth/onboarding pages (splash, sign-in, onboarding).
 * A large branded image panel sits alongside the page content on desktop, and
 * collapses to a compact banner above the content on mobile. The panel is a
 * pure image — logo/branding/feature content belongs in each page's own
 * content column.
 *
 * The hero image is `/auth-hero.png` on desktop (lg+) and `/mobile-auth-hero.png`
 * below that (drop both assets into `public/`); a primary-gradient fallback
 * shows through if either is absent.
 */
export function AuthLayout({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  /** Vertical alignment of the content column within its panel. */
  align?: "center" | "start";
}) {
  return (
    <div className="bg-base-100 relative flex min-h-screen flex-col lg:flex-row">
      <div className="absolute inset-e-4 top-4 z-20 w-32">
        <LanguageSwitcher />
      </div>

      {/* Branded image panel — full-height column on desktop, banner on mobile. */}
      <div className="from-primary to-primary/70 relative h-36 shrink-0 overflow-hidden bg-linear-to-br sm:h-48 lg:h-auto lg:w-1/2">
        <img
          src="/mobile-auth-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover lg:hidden"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <img
          src="/auth-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 hidden size-full object-cover lg:block"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Content panel. Scrolls if content exceeds the viewport. */}
      <div
        className={`flex flex-1 justify-center overflow-y-auto p-6 lg:p-10 ${
          align === "start" ? "items-start" : "items-center"
        }`}
      >
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
