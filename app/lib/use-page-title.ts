import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useRouteAnnouncerStore } from "@/store/use-route-announcer-store";

/**
 * Sets `document.title` to "{title} {app.bank}", reactive to the active i18n
 * language, and — on an actual route change (not just a title-text change,
 * e.g. a language switch re-translating the same page) — announces the new
 * title to screen readers and moves focus to the page's `#main-content`
 * landmark. SPA navigations don't get the focus/announcement a full page
 * load would imply for free, so this fills that gap for every route that
 * calls it (all of them).
 */
export function usePageTitle(title: string) {
  const { t } = useTranslation();
  const bank = t("app.bank");
  const fullTitle = `${title} ${bank}`;
  const { pathname } = useLocation();
  const announce = useRouteAnnouncerStore((s) => s.announce);

  const titleRef = useRef(fullTitle);
  titleRef.current = fullTitle;

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  useEffect(() => {
    // Only on pathname change, not on every title-text change (e.g. a
    // language switch shouldn't yank focus away from the switcher). Reading
    // the latest title via ref keeps it out of this effect's own deps.
    announce(titleRef.current);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname, announce]);
}
