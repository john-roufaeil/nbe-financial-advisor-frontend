import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/shared/preferences/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/preferences/ThemeToggle";
import { Z_DROPDOWN } from "@/lib/z-index";
import { useLayoutTier } from "@/lib/use-layout-tier";
import { useThemeStore } from "@/store/use-theme-store";
import { SkipLinks } from "@/components/shared/layout/SkipLinks";

/**
 * Split-screen shell for the auth/onboarding pages (splash, sign-in, onboarding).
 * A large branded image panel sits alongside the page content on desktop, and
 * collapses to a compact banner above the content on mobile. The panel is a
 * pure image — logo/branding/feature content belongs in each page's own
 * content column.
 *
 * The hero image is `/auth-hero.png` on desktop (lg+) and `/mobile-auth-hero.png`
 * below that (drop both assets into `public/`); a primary-gradient fallback
 * shows through if either is absent. On desktop, `/auth-hero-dark.png` is
 * cross-faded in over the light image when the site is in dark mode (and
 * back out on switch to light).
 *
 * All `lg:` desktop-split classes below are also gated on `!isForcedMobile`
 * (see useLayoutTier) so a user who scales the in-app font past 140% gets the
 * stacked mobile treatment even on a wide screen — real `lg:` media queries
 * only track viewport width, not this app's own JS-driven font-scale slider.
 */
export function AuthLayout({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  /** Vertical alignment of the content column within its panel. */
  align?: "center" | "start";
}) {
  const { t } = useTranslation();
  const isDark = useThemeStore((state) => state.theme === "dark");
  const tier = useLayoutTier();
  const isForcedMobile = tier === "mobile";
  const lg = (cls: string) => (isForcedMobile ? "" : cls);

  return (
    <div
      className={`bg-base-100 relative flex min-h-screen flex-col ${lg("lg:h-screen lg:flex-row lg:overflow-hidden")}`}
    >
      <div className={`absolute inset-e-8 top-8 flex items-center gap-2 ${Z_DROPDOWN}`}>
        <ThemeToggle />
        <LanguageSwitcher variant="btn-ghost" className="btn-sm bg-base-200" />
      </div>

      {/* Branded image panel — full-height column on desktop, banner on mobile. */}
      {/* Pinned to the light palette via data-theme regardless of the site-wide
          dark mode toggle — daisyUI redeclares every --color-* token directly
          on this element for [data-theme], so descendants (hero image shade,
          title/subtitle text) inherit the light values instead of html.dark's,
          keeping the branded panel identical in both themes. */}
      <div
        data-theme="nbe-financial-advisor"
        className={`from-primary to-primary/70 relative h-36 shrink-0 overflow-hidden bg-linear-to-br sm:h-48 ${lg("lg:h-auto lg:w-1/2")}`}
      >
        <img
          src="/mobile-auth-hero.png"
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 size-full object-cover ${lg("lg:hidden")}`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <img
          src="/auth-hero.png"
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 size-full object-cover ${isForcedMobile ? "hidden" : "hidden lg:block"}`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <img
          src="/auth-hero-dark.png"
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
            isForcedMobile ? "hidden" : "hidden lg:block"
          } ${isDark ? "opacity-100" : "opacity-0"}`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        {/* Shade behind the welcome copy so it stays legible over any hero image. */}
        <div className="from-base-content/80 absolute inset-0 bg-linear-to-t via-transparent to-transparent" />

        <div
          className={`absolute inset-s-0 bottom-0 p-4 text-start sm:p-6 ${lg("lg:p-10")}`}
        >
          <h1
            className={`text-base-100 text-lg font-semibold tracking-tight sm:text-2xl ${lg("lg:text-3xl")}`}
          >
            {t("authPanel.title")}
          </h1>
          <p className={`text-base-100/80 mt-1 text-xs sm:text-sm ${lg("lg:text-base")}`}>
            {t("authPanel.subtitle")}
          </p>
        </div>
      </div>

      {/* Content column. On mobile it scrolls with the page; on desktop (lg+) it
          scrolls independently while the image panel stays fixed. Wrapping
          SkipLinks + the actual #main-content target in their own flex-col
          here (rather than at the row-level root) keeps a revealed skip bar
          from becoming a rogue column when the root switches to lg:flex-row,
          and from disturbing the hero panel beside it. */}
      <div className={`flex flex-1 flex-col ${lg("lg:h-full lg:overflow-y-auto")}`}>
        <SkipLinks
          links={[{ href: "#main-content", label: t("nav.skipToMainContent") }]}
        />

        <div
          id="main-content"
          tabIndex={-1}
          className={`flex flex-1 justify-center p-4 focus:outline-none ${lg("lg:p-10")} ${
            align === "start" ? "items-start" : "items-center"
          }`}
        >
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
