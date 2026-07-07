import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/root-redirect.tsx"),
  layout("routes/lang-layout.tsx", [
    route(":lang", "routes/splash.tsx"),
    route(":lang/consent", "routes/consent.tsx"),
    route(":lang/onboarding", "routes/onboarding.tsx"),
    route(":lang/sign-in", "routes/sign-in.tsx"),
    layout("routes/app-layout.tsx", [
      route(":lang/dashboard", "routes/dashboard.tsx"),
      route(":lang/chat", "routes/chat.tsx"),
      route(":lang/data", "routes/data.tsx"),
    ]),
    route(":lang/*", "routes/not-found.tsx"),
  ]),
  route("*", "routes/root-redirect.tsx", { id: "catch-all-redirect" }),
] satisfies RouteConfig;
