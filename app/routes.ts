import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";
import { ROUTE_SEGMENTS } from "@/lib/constants/routes";

export default [
  index("routes/root-redirect.tsx"),
  layout("routes/lang-layout.tsx", [
    // Splash, onboarding, and sign-in are public but guest-only: an already
    // authenticated user is redirected straight to the dashboard. Onboarding
    // is safe here too — signup stores tokens without flipping
    // isAuthenticated, so a half-onboarded user never trips this guard.
    layout("routes/require-guest.tsx", [
      route(":lang", "routes/splash.tsx"),
      route(`:lang/${ROUTE_SEGMENTS.onboarding}`, "routes/onboarding.tsx"),
      route(`:lang/${ROUTE_SEGMENTS.signIn}`, "routes/sign-in.tsx"),
    ]),
    // Everything inside the app shell requires a session.
    layout("routes/require-auth.tsx", [
      layout("routes/app-layout.tsx", [
        route(`:lang/${ROUTE_SEGMENTS.dashboard}`, "routes/dashboard.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.chat}`, "routes/chat.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.transactions}`, "routes/transactions.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.bankStatements}`, "routes/bank-statements.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.profile}`, "routes/profile.tsx"),
      ]),
    ]),
    route(":lang/*", "routes/not-found.tsx"),
  ]),
  route("*", "routes/root-redirect.tsx", { id: "catch-all-redirect" }),
] satisfies RouteConfig;
