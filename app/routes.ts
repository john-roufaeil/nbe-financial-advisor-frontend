import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";
import { ROUTE_SEGMENTS } from "./lib/constants/routes";

export default [
  index("routes/root-redirect.tsx"),
  // Unprefixed: emailed links carry no locale context.
  route("verify-email", "routes/verify-email.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  // Fixed redirect_uri registered with the bank connector.
  route("bank-connect/callback", "routes/bank-connect-callback.tsx"),
  layout("routes/lang-layout.tsx", [
    layout("routes/require-guest.tsx", [
      route(":lang", "routes/splash.tsx"),
      route(`:lang/${ROUTE_SEGMENTS.onboarding}`, "routes/onboarding.tsx"),
      route(`:lang/${ROUTE_SEGMENTS.signIn}`, "routes/sign-in.tsx"),
    ]),
    layout("routes/require-auth.tsx", [
      layout("routes/app-layout.tsx", [
        route(`:lang/${ROUTE_SEGMENTS.dashboard}`, "routes/dashboard.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.chat}`, "routes/chat.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.transactions}`, "routes/transactions.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.bankStatements}`, "routes/bank-statements.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.budget}`, "routes/budget.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.recommendations}`, "routes/recommendations.tsx"),
        route(`:lang/${ROUTE_SEGMENTS.profile}`, "routes/profile.tsx"),
      ]),
    ]),
    route(`:lang/${ROUTE_SEGMENTS.admin}`, "routes/admin-sign-in.tsx"),
    layout("routes/require-admin.tsx", [
      route(`:lang/${ROUTE_SEGMENTS.adminDashboard}`, "routes/admin-dashboard.tsx"),
    ]),
    route(":lang/*", "routes/not-found.tsx"),
  ]),
] satisfies RouteConfig;
