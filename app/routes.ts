import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";
import { ROUTE_SEGMENTS } from "./lib/constants/routes";

export default [
  index("routes/root-redirect.tsx"),
  // Unprefixed (no :lang) — landing pages for links sent by email, where the
  // backend has no locale context for the user who'll click them.
  route("verify-email", "routes/verify-email.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  // Fixed redirect_uri the backend hands the bank connector — see
  // routes/bank-connect-callback.tsx for why this can't live under :lang.
  route("bank-connect/callback", "routes/bank-connect-callback.tsx"),
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
    // Admin app: separate credential space from end-user auth, so it sits
    // outside both the guest and auth guards above. The sign-in route guards
    // itself (redirects to the admin dashboard when a session exists).
    route(`:lang/${ROUTE_SEGMENTS.admin}`, "routes/admin-sign-in.tsx"),
    layout("routes/require-admin.tsx", [
      route(`:lang/${ROUTE_SEGMENTS.adminDashboard}`, "routes/admin-dashboard.tsx"),
    ]),
    // Same pages as the unprefixed /verify-email and /reset-password routes
    // above (the ones the emailed links actually point to — that never
    // changes, the backend has no locale context when composing them).
    // These :lang-prefixed twins exist purely so a user already browsing
    // the app at /en/... or /ar/... — or who switches language while on
    // one of these pages — gets a URL that matches the rest of the app,
    // instead of an inconsistent bare path. Outside require-guest: an
    // already-signed-in user (e.g. verifying email from a second tab)
    // shouldn't be bounced away from either page.
    // Explicit `id`s: react-router derives a route's id from its file path
    // by default, and these share a file with the unprefixed routes above
    // (same component, two paths) — without an override that's a duplicate
    // id, which doesn't just fail to register these two, it breaks the
    // ENTIRE route manifest build. Confirmed the hard way: that failure mode
    // makes the client-side POST to /verify-email get treated as a
    // full-page form submission with no resource-route action to handle it,
    // which is what an indefinitely "Verifying your email…" spinner
    // actually was — not a network or backend issue.
    route(`:lang/${ROUTE_SEGMENTS.verifyEmail}`, "routes/verify-email.tsx", {
      id: "routes/verify-email-localized",
    }),
    route(`:lang/${ROUTE_SEGMENTS.resetPassword}`, "routes/reset-password.tsx", {
      id: "routes/reset-password-localized",
    }),
    route(":lang/*", "routes/not-found.tsx"),
  ]),
  route("*", "routes/root-redirect.tsx", { id: "catch-all-redirect" }),
] satisfies RouteConfig;
