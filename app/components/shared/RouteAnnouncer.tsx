import { useRouteAnnouncerStore } from "@/store/use-route-announcer-store";

/** Visually-hidden `aria-live` region announcing route changes; see `usePageTitle`. */
export function RouteAnnouncer() {
  const message = useRouteAnnouncerStore((s) => s.message);
  return (
    <span role="status" aria-live="assertive" className="sr-only">
      {message}
    </span>
  );
}
