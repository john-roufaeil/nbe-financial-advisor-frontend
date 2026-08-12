import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/inter/wght-italic.css";
import "@/i18n";
import type { Route } from "./+types/root";
import "./app.css";
import { useTranslation } from "react-i18next";
import { useRef } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  // Captured once and never recomputed — this <title> is only the
  // pre-hydration/SSR fallback; usePageTitle owns document.title for every
  // real route from then on. Layout re-renders on every navigation (its
  // `children` prop changes via <Outlet>), and re-running t("app.name")
  // there raced usePageTitle's own effect, flashing the tab title down to
  // just the bare app name between the old and new page titles.
  const initialTitleRef = useRef<string>(undefined);
  if (initialTitleRef.current === undefined) initialTitleRef.current = t("app.name");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          // Applied synchronously before paint so the dark surface never flashes light first.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("nbe_theme");var t=s?JSON.parse(s).state.theme:"light";if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <title>{initialTitleRef.current}</title>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return null;
}

import { AccessibilityMenu } from "@/components/shared/preferences/AccessibilityMenu";
import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";
import { RouteAnnouncer } from "@/components/shared/RouteAnnouncer";
import { ToastHost } from "@/components/shared/ToastHost";
import { SessionExpiredModal } from "@/components/shared/modals/SessionExpiredModal";
import { useStackedModals } from "@/lib/use-stacked-modals";
import { useButtonRipple } from "@/lib/use-button-ripple";
import { useLanguageSwitchWatcher } from "@/lib/use-language-switch-watcher";

export default function App() {
  useStackedModals();
  useButtonRipple();
  useLanguageSwitchWatcher();
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProgressBar />
      <RouteAnnouncer />
      <AccessibilityMenu />
      <Outlet />
      <ToastHost />
      <SessionExpiredModal />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
