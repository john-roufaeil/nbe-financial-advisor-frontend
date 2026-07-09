import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/root-redirect.tsx"),
  layout("routes/lang-layout.tsx", [
    route(":lang", "routes/splash.tsx"),
    route(":lang/consent", "routes/consent.tsx"),
    route(":lang/onboarding", "routes/onboarding.tsx"),
    route(":lang/sign-in", "routes/sign-in.tsx"),
    // Everything inside the app shell requires a session. Splash, consent,
    // onboarding and sign-in stay public (onboarding especially — signup does
    // not flip isAuthenticated, so a guard here would bounce mid-flow).
    layout("routes/require-auth.tsx", [
      layout("routes/app-layout.tsx", [
        route(":lang/dashboard", "routes/dashboard.tsx"),
        route(":lang/chat", "routes/chat.tsx"),
        route(":lang/transactions", "routes/transactions.tsx"),
        route(":lang/documents", "routes/documents.tsx"),
        route(":lang/profile", "routes/profile.tsx"),
      ]),
    ]),
    route(":lang/*", "routes/not-found.tsx"),
  ]),
  route("*", "routes/root-redirect.tsx", { id: "catch-all-redirect" }),
] satisfies RouteConfig;
