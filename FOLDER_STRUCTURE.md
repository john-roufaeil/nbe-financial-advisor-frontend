# Folder Structure

What every folder and file under `app/` is for, and what else it's commonly called elsewhere. Current names already follow standard React/React-Router conventions unless noted otherwise.

## Top-level files

| File        | Purpose                                                                                     | Also commonly called            |
| ----------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| `root.tsx`  | React Router v7 root: HTML shell, global providers (`QueryClientProvider`), error boundary. | `App.tsx`, `_root.tsx`          |
| `routes.ts` | Route tree config (framework-mode route registration).                                      | `router.ts`, `routes.config.ts` |
| `app.css`   | Global stylesheet: Tailwind import, theme tokens, one-off global rules/animations.          | `globals.css`, `styles.css`     |

## `app/routes/` — page components

One file per URL, mapped in `routes.ts`. This is React Router v7's framework-mode convention (routes as files); the equivalent concept elsewhere is called **pages** (Next.js `pages/` or `app/`) or **views** (Vue/Angular). Layout routes (`app-layout.tsx`, `lang-layout.tsx`) wrap child routes with shared chrome (nav shell, `:lang` param handling) — sometimes called `_layout.tsx` in other frameworks.

Each file here should stay thin: page-level composition and data-fetching hook calls, not business logic.

## `app/components/` — UI building blocks

Standard name; alternative is **`ui/`** (common in shadcn-style projects). Organized by domain subfolder rather than one flat directory:

- `shared/` — cross-page primitives (`AppLayout`, `ConfirmDialog`, `ToastHost`, `Money`, `DateField`, `QueryState`, `LanguageSwitcher`). Alternative name: `common/`.
- `dashboard/`, `data/`, `chat/`, `onboarding/` — components used only by their matching route. `data/` specifically holds Transactions + Documents UI (could be split into `transactions/` + `documents/` if it grows further).
- `chat/tools/` — renderers for individual assistant tool-call results (one component per `toolName`). Alternative: `chat/tool-renderers/`.

## `app/api/` — HTTP calls to the real backend

Plain async functions wrapping `axios`, one file per backend resource (`transactions.ts`, `documents.ts`, `dashboard.ts`, `goals.ts`), plus `client.ts` (the shared axios instance + auth-token/401 interceptors). No React here — these are the same functions you'd unit test or Postman-replicate independent of any hook.

Alternative names: **`services/`**, **`http/`**, **`clients/`**. `api/` was chosen since it mirrors the backend's own route grouping 1:1, which makes cross-referencing the API docs easiest.

## `app/mocks/` — in-memory fake backend

Same function signatures as the matching `api/*.ts` file, but operating on a local mutable array with simulated latency (`mocks/shared.ts`'s `delay()`) instead of a network call. This is what powers the dashboard's mock/backend data-source toggle — `queries/*.ts` picks one implementation or the other at call time.

Alternative names: **`fixtures/`** (if they only returned static data), **`__mocks__/`** (Jest's auto-mock convention — avoid that specific name here since these aren't Jest module mocks, they're a real runtime data source the app can switch to deliberately).

## `app/queries/` — TanStack Query hooks

The React-facing layer: `useTransactions()`, `useCreateTransaction()`, etc. Each hook picks `api/*` or `mocks/*` based on `useDataSourceStore`, defines its query key, and (for mutations) invalidates the right cache entries and fires a toast.

This is intentionally **not** "one hook file per request" — files are grouped by resource/domain (matching `api/`), so a page pulls in one import for everything it needs on that domain. Alternative names: **`server-state/`**, or just **`hooks/`** if this were the only kind of hook in the app (it isn't — plain UI hooks live in `lib/`).

## `app/store/` — client-only state (zustand)

After this pass, every store here is genuinely client-only/ephemeral — no more fake server data:

- `use-auth-store.ts` — auth tokens + `isAuthenticated`, persisted.
- `use-onboarding-store.ts` — in-progress onboarding wizard draft, persisted.
- `use-personal-data-store.ts` — profile form state (still local-only; not yet wired to `api/`/`queries/` — see below).
- `use-drawer-store.ts` — mobile nav drawer open/closed.
- `use-confirm-store.ts` — generic "are you sure?" dialog.
- `use-toast-store.ts` — toast queue.
- `use-data-source-store.ts` — the mock/backend toggle, persisted.
- `use-balance-visibility-store.ts` — the eye-icon blur toggle, persisted.
- `use-chat-store.ts` — chat threads/messages. This one is borderline: chat has no real backend integration yet (still fully simulated via `lib/use-chat-runtime.ts`), so it currently plays the role `mocks/` plays for other domains. If/when chat gets a real `POST /chat/conversations/*` integration, this should split into `mocks/chat.ts` + a thin client-only store for just the current-thread-id/draft-input.

Alternative name: **`stores/`** (plural) is equally common; singular `store/` was kept since it already matches this repo's existing convention.

## `app/types/` — shared domain types

Plain interfaces/types with no logic (`Transaction`, `DocumentRecord`, `FinancialGoal`, `DashboardSummary`), one file per resource, matching `api/`/`mocks/`/`queries/`. Split out from the old `lib/demo-*.ts` fixture files so a type isn't coupled to any particular data source.

Alternative names: **`models/`** (common in backend-flavored codebases), **`interfaces/`** (less idiomatic in modern TS — prefer `type`/`interface` mixed as needed, not a name that presupposes `interface`).

## `app/lib/` — framework-agnostic helpers + non-domain hooks

Everything that isn't a component, a store, or a typed API call:

- `format.ts` — date formatting.
- `category-colors.ts`, `banks.ts` — small lookup/mapping helpers.
- `attachments.ts` — assistant-ui attachment adapter config.
- `use-chat-runtime.ts`, `use-page-title.ts` — hooks that don't belong to a specific backend resource (so don't fit `queries/`).
- `query-client.ts` — the shared TanStack `QueryClient` instance.
- `toast.ts` — thin wrapper pairing `i18n.t()` with `useToastStore`, callable from non-component code (e.g. inside a `queries/*.ts` mutation's `onError`).
- `demo-financials.ts` — the chat domain's still-simulated response generator (spending/transactions/savings tool builders + keyword triggers). Naming note: now that `mocks/` exists as the established name for "fake data source," this file arguably belongs there too (`mocks/chat.ts`) — kept in `lib/` for now only because it's tangled with the not-yet-modularized chat runtime.

Alternative name: **`utils/`** or **`helpers/`** — `lib/` is equally standard and was kept as-is.

## `app/i18n/` — translations

- `index.ts` — i18next setup; imports every per-domain JSON file per language and merges them into one `common` namespace (so existing unprefixed `t("dashboard.foo")` calls keep working unchanged).
- `locales/<lang>/*.json` — one file per domain (`app`, `nav`, `actions`, `status`, `confirm`, `toast`, `finance`, `auth`, `dashboard`, `chat`, `data`, `settings`, `notFound`), mirroring the route/domain split used everywhere else in `app/`. Previously one large `common.json` per language; split for the same reason `api/`/`queries/`/`types/` are split — smaller, independently reviewable diffs, easier to find a given string.

Alternative name: **`locales/`** at the top level (i.e. `app/locales/` instead of `app/i18n/locales/`) is equally common; `i18n/` was kept since it also holds the non-translation setup file.

## `app/schemas/`

- `example.schema.ts` — a documented template showing the intended zod-schema convention for a future resource; not dead code, but not wired to anything yet either.

Alternative name: **`validation/`**.

---

## Cross-cutting note: the four-layer pattern

Every backend-integrated domain (transactions, documents, dashboard, goals) now follows the same four-file shape:

```
types/<domain>.ts     — plain interfaces, no logic
api/<domain>.ts       — real HTTP calls (axios), same function signatures as mocks/
mocks/<domain>.ts     — in-memory fake, same function signatures as api/
queries/<domain>.ts   — useQuery/useMutation hooks; picks api/ or mocks/ per useDataSourceStore
```

New domains (e.g. profile, chat, accounts) should follow this same shape rather than inventing a new pattern.
