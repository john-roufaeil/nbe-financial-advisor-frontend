# Production Readiness Report — nbe-financial-advisor-frontend

**Scope:** `nbe-financial-advisor-frontend` (React 19, TypeScript, React Router v7 SPA, TanStack Query v5, Zustand v5, Tailwind v4 + DaisyUI v5). Read-only static audit — no code modified.

**Methodology note:** The sandbox's Node tooling was broken (dangling `pnpm`/`corepack` symlinks, an incompatible ancient global `npm`), so `pnpm lint`, `pnpm typecheck`, and `pnpm build` could not be executed. All findings below come from direct source reading and targeted greps, not automated tooling output. **Run `pnpm lint`, `pnpm typecheck`, `pnpm check:i18n`, and `pnpm build` in a working environment as a final gate before launch** — this audit cannot substitute for that.

**Status re-evaluated 2026-08-15:** this is a point-in-time report and is left otherwise unedited; individual findings below now carry a **`[STATUS]`** tag where they've since changed. See `PRODUCTION_READINESS_STATUS.md` for the current tracker and `../SECURITY_AUDIT_REPORT.md`'s "Remediation Status" table for the full cross-repo picture.

---

## 1. Project Architecture

- **[Suggestion] Architecture** — repo-wide — No orphaned/dead files found; every sampled component/hook/query/mock resolves to a real importer, and the mock system is fully wired (every `mocks/*.ts` has exactly one `queries/*.ts` consumer). No action needed.
- **[Low] Dependencies** — `package.json` — `lucide` (0 usages; `lucide-react` has 92) and `isbot` (0 usages, SSR-only package in an `ssr: false` app) are unused. **Fix:** remove both from `package.json`.
- **[Medium] Duplication** — `AddBankAccountModal.tsx`, `AddBankStatementModal.tsx`, `AddTransactionModal.tsx` — All three hand-roll near-identical "ghost Cancel + `reset()` + `closeDialog(ref)`" and `useForm`/`zodResolver` submit wiring; `AddTransactionModal` already benefits from `useTransactionForm` extracting this while the other two don't. **Fix:** extract a shared `useModalMutationForm` hook following the existing `useTransactionForm` pattern.
- **[Low] Duplication** — `use-page-size-store.ts`, `use-accessibility-store.ts`, `use-display-preferences-store.ts`, `use-dashboard-prefs-store.ts` — Repeated `persist()` boilerplate, including two independent copies of a "validate persisted field against allow-list" `merge` function. **Fix:** extract a shared `createPersistedStore`/`mergeWithValidation` utility.
- **[Suggestion] Duplication** — `ProductsPanel.tsx` (398 lines) vs `CategoriesPanel.tsx` (272 lines) — Both hand-roll the same filter+debounce+pagination+modal+confirm-delete shape independently. **Fix:** factor a shared `useAdminCrudPanel` hook before a third admin panel is added.
- **Positive:** Layering is completely clean — no `components/**` file imports `api/*`/`mocks/*` directly; every `queries/*.ts` file only reaches an implementation via the shared `pickImpl` helper. No circular dependencies found.

## 2. React Best Practices

- **[Medium] Hook correctness** — `app/lib/use-sidebar-resize.ts:23-46` — `mousemove`/`mouseup` listeners are attached to `document` inside the `mousedown` handler itself, not inside a `useEffect` with cleanup; if the component unmounts mid-drag (e.g. a route change), the listeners and body cursor/user-select styles never get removed. **Fix:** move the drag lifecycle into a ref-driven `useEffect` that tears down on unmount.
- **[Medium] Hook correctness** — `app/lib/use-extracted-transactions-draft.ts:15-17` — The resync effect depends on `[doc?.id, doc?.status]` but reads `doc?.extractedTransactions` inside; a background refetch that changes the array without changing id/status leaves the local draft stale. **Fix:** confirm intent, and if unintentional, key the effect off a version/updated-at field.
- **[Medium] Performance** — `app/lib/use-chat-runtime.ts:186-252` — `threadListAdapter` (with inline `onSwitchToNewThread`/`onRename`/`onDelete`/`convertMessage`) is rebuilt as a new object every render and passed into `useExternalStoreRuntime`, a third-party hook the React Compiler cannot stabilize across. **Fix:** verify with assistant-ui docs whether the adapter needs referential stability; if so, wrap in `useMemo`.
- **[Medium] Maintainability** — `app/routes/onboarding.tsx` (429 lines, largest file in the repo) — Single component owns step navigation/gating, three chained async mutations with manual retry-resume bookkeeping, RTL animation math, and full JSX. **Fix:** extract `handlePrimary`/`stepCanContinue`/`firstBlockingStep` into a `use-onboarding-flow.ts` hook, following the `use-transaction-form.ts` pattern already used elsewhere.
- **[Suggestion] Maintainability** — `app/lib/use-chat-runtime.ts` (253 lines) — Combines runtime-adapter wiring with conversation-title derivation business logic in one hook. **Fix:** split title derivation into `use-conversation-title.ts`.
- **Positive:** Zero `createContext`/`useContext` usage anywhere — all cross-cutting state goes through narrow, selector-based Zustand stores, so broad-re-render-via-context is a non-issue.
- **Positive:** All paginated lists (transactions, bank statements, admin panels) genuinely paginate server-side rather than rendering unbounded arrays — no virtualization gap.
- **Positive:** Polling (`queries/chat.ts`, `queries/bank-statements.ts`) uses TanStack Query's own `refetchInterval` rather than hand-rolled `setInterval` — no manual-timer-cleanup bugs.

## 3. TypeScript

- **[Low] Type organization** — `app/queries/bank-connections.ts:20,22,46,48` — Uses raw string literal `"bank-connections"` for cache keys instead of the shared `QUERY_ROOTS` constant every other query module uses. **Fix:** switch to `QUERY_ROOTS.bankConnections` for typo-safety.
- **Positive:** Full-repo grep confirms **zero** `: any` / `as any` / `<any>` and **zero** non-null assertions (`!.`) anywhere in `app/`. `tsconfig.json` has `strict: true`. This is genuinely excellent discipline for a codebase this size.
- **Positive:** Zero `@ts-ignore`/`@ts-expect-error` usage. The `Transaction`/`RawTransaction` wire-format-vs-domain-type translation pattern in `app/api/transactions.ts` is a clean, honest boundary model.

## 4. Performance

- **[Low] Bundle size** — `app/routes.ts` and route files — Only `chat.tsx` pairs `lazy()` + `Suspense` + an `ErrorBoundary`; dashboard, transactions, bank-statements, and the entire admin panel (only reachable by `super_admin`/reviewer roles) are eagerly bundled into the main chunk that every ordinary user downloads. **Fix:** apply the same `lazy()`+`Suspense` pattern to admin routes at minimum.
- **[Low] CLS risk** — `SidebarHeader.tsx:61-72`, `AuthLayout.tsx:59-77`, `onboarding.tsx:263`, `splash.tsx:30`, `sign-in.tsx:131` — All logo `<img>` tags are sized only via Tailwind classes with no `width`/`height` attributes, so the browser can't reserve layout space before decode. **Fix:** add intrinsic `width`/`height` or `aspect-ratio`.
- **Positive:** React Compiler (`babel-plugin-react-compiler`) is genuinely wired into `vite.config.ts` (not a dead devDependency), auto-handling most memoization concerns.
- **Positive:** Query defaults are sane for a financial app — mutations retry 0 times (no accidental duplicate financial writes), queries retry 2, 30s staleTime, `refetchOnWindowFocus` disabled.

## 5. Security

- **[Critical] Security headers / CSP** — `nginx.frontend.conf` (10 lines total) — Zero security headers configured: no `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Referrer-Policy`. A financial app with no clickjacking protection and no CSP defense-in-depth one week from launch is a material gap even with a clean app-level XSS surface. **Fix:** add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and a CSP (the one static inline script in `root.tsx` has no user data, so a nonce/hash-based `script-src` is feasible). **[STATUS 2026-08-15: ⚠️ Mostly fixed]** — CSP/`X-Frame-Options`/`X-Content-Type-Options`/`Referrer-Policy`/`Permissions-Policy` all added. `script-src`/`style-src` needed `'unsafe-inline'` rather than a nonce — verified against the actual built `index.html`, which has an inline theme-boot script _and_ React Router's own inline SPA-hydration bootstrap script, plus 19 components using inline `style={{}}`; no nonce infrastructure exists to do better without a larger change. `Strict-Transport-Security` was added the same day along with a `listen 443 ssl` self-signed cert, then deliberately reverted — for pure-loopback traffic a self-signed cert protects against no real threat while costing a browser trust-warning. Back to `listen 80` only.
- **[Critical] Data integrity / trust** — `app/components/shared/layout/SidebarFooter.tsx:47` renders `DataSourceToggle.tsx` unconditionally for every signed-in user, with no `import.meta.env.DEV` gate or feature flag (verified directly: no env check present). Any real user can flip their own account to fabricated mock financial data (`app/mocks/*.ts`) and mistake fake balances/transactions/goals for real ones. **Fix:** gate this component behind a dev/staging-only build flag before the production build.
- **[High] Debug/error leakage** — `app/routes/bank-connect-callback.tsx:46-52,171-185` — A comment explicitly labels `debugError` a "TEMPORARY debugging aid" that renders raw, untranslated backend error text to the user on bank-login/connect OAuth failure instead of failing quietly. Confirmed still present. **Fix:** remove the `debugError` state and both `setDebugError(...)` branches; confirm the underlying bug is fixed first.
- **[High] PII/financial data in localStorage** — `app/store/use-onboarding-store.ts:59-77` — `persist()` has no `partialize`, so the full `data` object (name, email, phone, monthly income, goal target amount, employment status, dependents count) is written to `localStorage` in plaintext under `nbe_onboarding` and survives indefinitely until `reset()`. **Fix:** add a `partialize` that only persists non-sensitive progress fields (`step`, `started`), or add expiry.
- **[Medium] Inconsistent token storage posture** — `app/store/use-admin-auth-store.ts:26-40` — Unlike the end-user store (access token deliberately in-memory only), the admin token is persisted to `sessionStorage`. This is a documented, deliberate tradeoff (no backend admin-refresh endpoint exists) and is scoped to the tab's lifetime rather than `localStorage`, so it's not a raw oversight — but it is a weaker posture than the rest of the app holds itself to for a plausibly higher-privilege credential. **Fix:** if reload-persistence must stay, keep the admin bundle's XSS surface especially tight; otherwise drop persistence and require re-login per tab. **[STATUS 2026-08-15: ✅ Fixed]** — the backend now has `POST /admin/auth/refresh`/`POST /admin/auth/logout` (httpOnly cookie, mirrors the end-user flow); this store was rewritten to keep the token in memory only, matching `use-auth-store.ts` exactly. Verified with a real browser: no token in any storage after login, session restores on reload via the cookie, logout genuinely revokes it server-side.
- **[Medium] Stale user data not cleared on logout** — `app/store/use-auth-store.ts:8-12` — `clearUserScopedState()` only clears the query cache and `useChatStore`'s current conversation id; it never clears `useMessageFeedbackStore`, `useMessageAttachmentsStore`, `useConversationTitleStore`, or `useNotificationsStore` (all persisted). On a shared device, a second user signing in after the first logs out can still see derived conversation titles/feedback/attachment metadata from the first account. **Fix:** clear these stores in `logout()`/`expireSession()`/`clearStaleAuth()` alongside `queryClient.clear()`.
- **[Low] No client-side auth-email cooldown** — `VerifyEmailBanner.tsx:26-33`, `ForgotPasswordModal.tsx:77-83` — The resend button re-enables as soon as the mutation settles; no client-side backoff, relying entirely on backend rate limiting. **Fix:** add a short cooldown timer as defense-in-depth.
- **[Suggestion] No client-side pre-upload file validation** — `app/lib/attachments.ts:34-35` — File size/MIME are only validated server-side after a full upload round trip. **Fix:** add a lightweight pre-upload check for faster feedback (server-side must remain authoritative).
- **[Suggestion] No client-side login-attempt throttling** — `app/routes/sign-in.tsx:75-95` — No debounce/backoff on repeated submits beyond `isPending` disabling the button. Reasonable to leave server-enforced, but worth adding as defense-in-depth.
- **Positive:** Access-token architecture is textbook-correct: token in-memory only, `partialize` persists only `isAuthenticated`, password never touches any persisted store, single shared `refreshPromise` dedupes concurrent-401 refresh storms, `_retried` flag prevents infinite retry loops, auth endpoints excluded from the retry path.
- **Positive:** OAuth `postMessage` handoff (`lib/oauth-popup.ts`) is correctly origin-scoped on both send and receipt.
- **Positive:** No `dangerouslySetInnerHTML`/`eval`/`innerHTML`/`document.write` XSS surface anywhere except one static, data-free inline theme-boot script in `root.tsx`; chat messages render exclusively through assistant-ui's safe text primitives, never raw HTML. The one `target="_blank"` link found correctly sets `rel="noreferrer"`.
- **Positive:** `.env`/`.env.local` are gitignored; only `VITE_API_BASE_URL` (a plain host, not a secret) is used client-side; no committed secrets found.

## 6. API Integration

- **[Low] Query-key discipline gap** — see Section 3 (`bank-connections.ts` raw string key).
- **Positive:** `pickImpl(source, api, mocks)` pattern is applied consistently across every `queries/*.ts` file; switching data sources re-triggers every active query cleanly since `source` is part of every query key.
- **Positive:** 401 handling, refresh dedup, and retry-loop prevention (see Section 5) represent solid, production-grade API integration engineering.
- **Positive:** Mutation retries are disabled by default (no duplicate financial writes on retry), and toasts + cache invalidation are handled centrally by `useInvalidatingMutation`.

## 7. Forms

- **[High] Accessibility** — `app/components/accounts/BankAccountFields.tsx`, `app/components/transactions/TransactionFormFields.tsx` — Neither sets `aria-invalid`/`aria-describedby` on inputs despite showing error styling and text, unlike `AccountStep.tsx` and `sign-in.tsx` which do this correctly. Screen-reader users get no indication of which field failed validation in the two most-used "add" flows. **Fix:** apply the same `aria-invalid`/`aria-describedby`/`role="alert"` pattern already used in `AccountStep.tsx`.
- **[Low] Missing trim** — `app/components/auth/ForgotPasswordModal.tsx:22-24` — Email schema has no `.trim()` unlike `AccountStep.tsx`/`AddBankAccountModal.tsx`; a pasted trailing space could fail validation or reach the API untrimmed. **Fix:** add `.trim()`.
- **[Suggestion] Cancel stays enabled during submit** — `AddBankAccountModal.tsx`, `AddTransactionModal.tsx`, `AddBankStatementModal.tsx` — Clicking Cancel while a mutation is in flight closes the dialog immediately even though the request is still running. **Fix:** disable Cancel while `isPending`.
- **Positive:** Forms consistently use Zod + react-hook-form with real validation (email format, password length, `libphonenumber`-backed phone validation, unicode-aware name pattern).
- **Positive:** `Button.tsx` centralizes the loading+disabled double-submit guard, applied consistently across every mutation-driven submit button reviewed.
- **Positive:** `MoneyInput.tsx` correctly caps decimal precision at 2 places and floors at 0, preventing negative/over-precise amounts at the input level.

## 8. Routing

- **[Medium] 404 masked at top level** — `app/routes.ts:66` — An unknown top-level path (no valid `:lang`) silently redirects via `root-redirect.tsx` instead of showing a 404, while the same case inside `:lang/*` correctly hits `not-found.tsx`. Broken/mistyped external links become invisible redirects instead of a diagnosable 404. **Fix:** route genuinely unmatched top-level paths to a locale-detecting 404.
- **[Low] Hardcoded route segments** — `RequireAuth.tsx:29`, `not-found.tsx:13`, `SidebarNav.tsx:18,46` — Bypass `ROUTE_SEGMENTS`/`localizedPath()` even though the rest of the app uses them consistently; a future segment rename would silently break these four call sites. **Fix:** replace with `localizedPath(lang, ROUTE_SEGMENTS.x)`.
- **Positive:** Return-to-URL after login works correctly (`RequireAuth` passes `state={{ from: location }}`; `sign-in.tsx` reads it back).
- **Positive:** Admin routing is cleanly isolated from user auth — separate store, separate axios instance, separate 401 handling, no shared code path or session-confusion risk.

## 9. UI / UX

- **[Low] Empty/error/loading states** — Dashboard, transactions, and bank-statements pages consistently wire `isPending`/`isError`/skeleton/error-state with retry via `refetch()` — no material gaps found.
- **[Low] Stray physical-direction class** — `app/components/dashboard/GoalCard.tsx:137` — One `text-right` instead of `text-end`; will misalign in Arabic/RTL for this element only. **Fix:** swap to `text-end`.
- **Positive:** RTL readiness is strong — a full-tree grep found only this one stray physical-direction class across the entire app, meaning the logical-property convention is consistently followed.
- **Positive:** Dark mode and a genuine (non-stub) high-contrast accessibility mode are implemented via real CSS overrides plus a working `AccessibilityMenu`/`HighContrastToggle`.

## 10. Styling

- **[Low] Process gap, not a live defect** — `scripts/check-no-hardcoded-hex.sh:5-11` — Only diffs staged/PR changes, never the full existing tree, so it can only catch new hex additions going forward. A full-tree grep confirms zero violations exist today outside `app/app.css`. **Fix (optional):** add a periodic full-repo scan as a separate CI job for defense-in-depth.
- **Positive:** No hardcoded hex colors found anywhere outside `app/app.css`. The 21 `style={{}}` usages found across 15 files are all legitimately dynamic values (computed positions, chart geometry), not raw colors/spacing that should be Tailwind classes.

## 11. Production Readiness

- **[Critical] Testing** — see Section 12.
- **[Critical] Security headers / trust** — see Section 5 (nginx headers, DataSourceToggle exposure).
- **[High] Debug leftover** — see Section 5 (`bank-connect-callback.tsx`).
- **[Medium] Broken artifact** — `Dockerfile` (root, not `Dockerfile.prod`) — Ends with `CMD ["npm", "run", "start"]`, but `package.json` has no `"start"` script and `react-router.config.ts` sets `ssr: false` (no server bundle to serve); it also mixes `npm` while `Dockerfile.prod`/`Dockerfile.dev` use `pnpm`, and a different base image. This will fail if anyone runs it during launch week. **Fix:** delete it or align it with the working `Dockerfile.prod` nginx-serve pattern.
- **[Medium] Missing ops basics** — `nginx.frontend.conf` — No gzip/brotli compression and no health-check location block for container-orchestrator liveness/readiness probes (separate from the missing security headers noted in Section 5). **Fix:** add `gzip on;` and a `location /healthz { return 200; }` block.
- **[Low] Magic-number timeouts** — `app/lib/oauth-popup.ts:41,56`, `NavigationProgressBar.tsx:55-56` — Bypass `lib/constants/time.ts`, unlike `ToastHost.tsx`/`use-button-ripple.ts`/`BankStatementStatusBadge.tsx` which use named constants. **Fix:** move these four literals into `time.ts`.
- **[Low] localStorage key literal duplication** — `app/root.tsx:30` — Pre-hydration inline theme script reads `localStorage.getItem("nbe_theme")` as a raw string duplicating `STORAGE_KEYS.theme`. **Fix:** interpolate the constant into the template literal.
- **Positive:** No `console.log`/`TODO`/`FIXME`/`XXX`/`debugger` litter anywhere in the codebase (only one legitimate, dev-gated `console.error` in `ErrorBoundary.tsx`).
- **Positive:** Global error boundary is wired at both the route root (`root.tsx`) and a reusable feature-level `ErrorBoundary.tsx`, with error details gated behind `import.meta.env.DEV` — no stack traces leak to real users.
- **Positive:** `chat.tsx` correctly pairs `Suspense` + `lazy()` + an `ErrorBoundary` for its deferred bundle — a real pattern to extend elsewhere (see Section 4).

## 12. Testing Readiness

- **[Critical] Zero test coverage** — repo-wide — No `*.test.ts(x)`/`*.spec.ts(x)` files exist anywhere, no e2e config (Playwright/Cypress), and `.github/workflows` runs only lint/format/typecheck/build/secret-scan — no test step at all. A money-handling, auth-gated, OAuth-integrated fintech app shipping with zero automated regression coverage one week before launch is the single largest risk in this audit.
- **Recommended minimum-viable coverage before launch, ranked by risk:**
  1. **Sign-in / session refresh** (`require-auth.tsx`, `use-auth-store.ts`, `api/client.ts` interceptor) — integration test; a regression here locks out every user.
  2. **Bank OAuth connect/login popup** (`bank-connect-callback.tsx`, `oauth-popup.ts`) — e2e (Playwright): popup blocked fallback, user closes popup early, successful code/state round trip. This flow is intricate and stateful enough that inspection alone won't catch regressions.
  3. **Onboarding stepper** (`onboarding.tsx`) — integration test; blocks all new signups if broken.
  4. **Money/number formatting** (`lib/format.ts`: `parseMoneyInput`, `formatMoney`) — unit tests at boundary values (0, negative, max value, comma-grouping round-trip).
  5. **Budget/allocation math** (`AllocationsEditModal.tsx`) — unit test asserting allocations always sum to exactly 100; hand-rolled percentage math is a rounding bug away from misstating a user's budget.
  6. **Transaction CRUD** (`AddTransactionModal.tsx`, `TransactionDetailModal.tsx`) — unit + integration for money correctness.
  7. **Bank statement upload/review** (`AddBankStatementModal.tsx`) — integration test for file-handling edge cases.
  8. **AI chat streaming** (`use-chat-runtime.ts`) — integration test; no visible error/retry telemetry in the runtime hook itself.

## 13. Maintainability

- **Top 10 largest files by line count:** `routes/onboarding.tsx` (429), `components/admin/ProductsPanel.tsx` (398), `mocks/bank-statements.ts` (318), `components/accounts/BankAccountsCard.tsx` (285), `components/admin/CategoriesPanel.tsx` (272), `lib/use-chat-runtime.ts` (253), `api/bank-statements.ts` (253), `components/bank-statements/AddBankStatementModal.tsx` (248), `components/dashboard/RecentActivityCard.tsx` (245), `queries/chat.ts` (232).
- **Positive:** File naming is fully consistent — 126/126 component files PascalCase, 20/20 route files kebab-case.
- **Positive:** No genuinely tangled nested-ternary logic found in any sampled large file; size is the concern, not local complexity.
- See Section 2 for the `onboarding.tsx` god-component finding and Section 1 for duplication findings — these are the primary maintainability risks.

---

# Final Summary

## Production Score

**64 / 100** _(as scored 2026-08-12; not re-scored — see the `[STATUS]` tags throughout and `PRODUCTION_READINESS_STATUS.md` for what's changed since. Security headers, one of the three Criticals below, is now fixed.)_

The underlying engineering is genuinely strong — textbook in-memory-token auth architecture, zero `any`/non-null assertions across the whole codebase, strict TypeScript, clean unidirectional layering with no circular dependencies, no XSS surface, strong RTL/i18n discipline, and consistent naming. The score is held down by three Critical, launch-relevant gaps (zero test coverage, no security headers, and a live toggle that lets any user switch to fabricated financial data) that are orthogonal to code quality but material for a fintech app shipping in a week.

## Risk Summary

| Severity   | Count |
| ---------- | ----- |
| Critical   | 3     |
| High       | 4     |
| Medium     | 11    |
| Low        | 13    |
| Suggestion | 4     |

## Release Blockers

1. Add security headers (CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS) to `nginx.frontend.conf` — currently zero. **[STATUS 2026-08-15: ⚠️ Mostly fixed — CSP/`X-Frame-Options`/`X-Content-Type-Options`/`Referrer-Policy`/`Permissions-Policy` added; HSTS + a TLS listener were added then deliberately reverted the same day (pure-loopback deployment, no real benefit from a self-signed cert here).]**
2. Gate `DataSourceToggle` behind a dev/staging-only flag so production users cannot switch their own account to fabricated mock financial data.
3. Remove the `debugError` "TEMPORARY debugging aid" in `bank-connect-callback.tsx` that leaks raw, untranslated backend errors on OAuth failure.
4. Add `partialize` (or expiry) to `use-onboarding-store.ts` so PII/financial data doesn't sit unencrypted in `localStorage` indefinitely.
5. Ship at minimum the ranked-critical-flow tests in Section 12 (sign-in/session, bank OAuth, onboarding, money formatting, budget math) — full coverage isn't achievable in a week, but zero coverage on money/auth flows is not acceptable to launch with.
6. Fix or delete the broken root `Dockerfile` (references a non-existent `npm start` script).
7. Run `pnpm lint`, `pnpm typecheck`, `pnpm check:i18n`, and `pnpm build` in a working environment and resolve any warnings — not verifiable in this audit's sandbox.

## Recommended Before Launch

- Add keyboard navigation (arrow keys, type-ahead) to the shared `EntityPicker` listbox — it backs every picker/select app-wide.
- Add `aria-invalid`/`aria-describedby` to `BankAccountFields.tsx` and `TransactionFormFields.tsx`, matching the pattern already used in `AccountStep.tsx`.
- Clear all persisted user-scoped stores (message feedback, attachments, conversation titles, notifications) on logout, not just the query cache — prevents cross-account data leakage on shared devices.
- Fix the top-level catch-all route so unknown paths outside `:lang` show a 404 instead of silently redirecting.
- Add gzip and a health-check endpoint to `nginx.frontend.conf`.
- Fix the `use-sidebar-resize.ts` listener leak on unmount-mid-drag.

## Nice-to-Have

- Extract shared hooks/components for the triplicated Add*Modal boilerplate and the duplicated admin CRUD panel shape.
- Extract `onboarding.tsx`'s flow logic into a dedicated hook.
- Lazy-load the admin panel and other heavy non-chat routes to shrink the bundle every ordinary user downloads.
- Remove unused `lucide` and `isbot` dependencies.
- Route timeout/duration literals in `oauth-popup.ts` and `NavigationProgressBar.tsx` into `lib/constants/time.ts`.
- Add `width`/`height` to logo `<img>` tags to eliminate CLS risk.

## Overall Verdict

🟠 **Significant Work Recommended**

- The codebase demonstrates senior-level engineering discipline (auth architecture, TypeScript strictness, layering, i18n/RTL) that most of these findings don't touch.
- However, three Critical, launch-relevant gaps — zero test coverage on money/auth flows, no security headers, and an unguarded mock-data toggle exposed to real users — are not "minor fixes" for a financial product going live in one week.
- All three Criticals plus the four High findings are individually cheap to fix (hours to a couple of days each) except full test coverage, which realistically needs a scoped, ranked minimum-viable set rather than a comprehensive suite in the remaining time.
- Once the Release Blockers above are closed, this app would credibly move to 🟡 Ready with Minor Fixes.
