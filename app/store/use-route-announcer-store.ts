import { create } from "zustand";

interface RouteAnnouncerState {
  message: string;
  announce: (message: string) => void;
}

/** Holds the latest "page changed to X" text for the visually-hidden live
 * region in `RouteAnnouncer`, so screen-reader users get feedback on SPA
 * route changes the same way a full page load's title change would imply. */
export const useRouteAnnouncerStore = create<RouteAnnouncerState>((set) => ({
  message: "",
  announce: (message) => set({ message }),
}));
