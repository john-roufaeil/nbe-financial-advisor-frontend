# NBE Financial Advisor — Frontend

React Router v7 (SPA) · TypeScript · Tailwind v4/DaisyUI · TanStack Query · Zustand · i18next (en/ar) · assistant-ui + Tool UI (chat)

## Setup

```bash
# once, so new terminals auto-load the right Node version
echo 'cd() { builtin cd "$@"; [ -f .nvmrc ] && nvm use --silent; }' >> ~/.bashrc && source ~/.bashrc

corepack enable && corepack prepare pnpm@11.10.0 --activate
pnpm install
cp .env.example .env.local
pnpm dev
```

Or: `docker build -f Dockerfile.dev -t frontend-dev . && docker run --rm -it -p 5173:5173 -v "$(pwd)":/app -v /app/node_modules --env-file .env.local frontend-dev`

`pnpm` requires Node ≥22 (pinned `packageManager: pnpm@11.10.0`); the default shell Node may be v20 — `nvm use 22` first if `pnpm` errors immediately. `node_modules/.bin/tsc`/`eslint` work under either Node version.

## Scripts

`dev` `build` `lint` `lint:fix` `format` `format:check` `typecheck` `check:i18n`. Pre-commit hook (Husky + lint-staged) auto-runs lint+format on staged files; `check:i18n` and the no-hardcoded-hex check (`scripts/check-no-hardcoded-hex.sh`) also gate CI — run all of these before opening a PR.

## Folder structure

```bash
app/
  routes.ts                register every route here (nested layouts: lang → require-auth → app-layout)
  routes/                   one file per page — dashboard, chat, transactions, documents, profile, onboarding, sign-in...
  components/
    shared/                 cross-context display components — reused by pages AND chat tools
    dashboard/, data/, onboarding/  feature-scoped components, co-located by area
    chat/                   chat scaffolding (thread, bubbles, input) + chat/tools/ (LLM tool-call → UI renderers)
  api/                      real backend calls (axios via api/client.ts) — one file per domain
  mocks/                    in-memory fake data, same function signatures as api/ — for demo/offline mode
  queries/                  TanStack Query hooks components actually import — picks api/ or mocks/ per useDataSourceStore
  types/                    TypeScript types per domain, shared by api/mocks/queries
  store/                    Zustand stores — client-only UI/session state (see below)
  lib/                      utilities + misc hooks not tied to server state (format, pagination, toast, query-client...)
  i18n/                     i18next setup + locales/{en,ar}/*.json (one JSON per feature area)
  root.tsx, app.css
```

## Data flow — api/ vs mocks/ vs queries/

- **`api/*.ts`** — plain async functions hitting the real backend via the shared `apiClient` (axios, auto Bearer token + refresh-on-401, in `api/client.ts`). No React involved.
- **`mocks/*.ts`** — fake implementations with the _identical_ function signatures as their `api/` counterpart.
- **`queries/*.ts`** — the only layer components should import. Each hook (`useAccounts`, `useCreateAccount`, ...) picks `api/` or `mocks/` at call time based on `useDataSourceStore` (`source: "mock" | "backend"`, persisted, defaults to `"backend"`), and owns query keys, cache invalidation, and success/error toasts.

**Never import `api/` or `mocks/` directly from a component** — always go through `queries/`. This is what lets someone flip the data-source toggle (Profile → Preferences) and see the whole app switch between live data and demo data with zero component changes.

Local auth testing: the backend will 422 on fake credentials since the default source is `"backend"`. To log in against mocks instead: `localStorage.setItem('nbe_data_source', JSON.stringify({state:{source:'mock'},version:1}))`, reload, then any email/password works.

## Add a page

1. File in `app/routes/`, register in `app/routes.ts` in the right layout tier (public vs `require-auth` vs inside `app-layout`).
2. Add new strings to **both** `en/*.json` and `ar/*.json` in `app/i18n/locales/` — `pnpm check:i18n` fails otherwise (parity + "every `t()` key exists" checks).
3. Server data → a `queries/` hook, never a raw `useEffect` fetch. Forms → React Hook Form + Zod. Multi-step flows (onboarding) → a Zustand store for step state.

## Components — build once, use in both dashboard and chat

- **Shared, prop-driven, no fetching inside** → `app/components/shared/`. Pages feed them via a `queries/` hook; the chatbot feeds the _same_ component via `app/components/chat/tools/` when the LLM calls a matching tool (see `chat/tools/index.ts` for the tool → component map). Don't fork a component per context.
- Feature-only, one-off → co-locate under `components/dashboard|data|onboarding/` next to its route.
- Chat-only scaffolding (thread, bubbles, input) → `app/components/chat/` (not `chat/tools/`).
- DaisyUI classes only, **never hardcoded hex** (CI-enforced via `scripts/check-no-hardcoded-hex.sh`). Logical properties (`ms-`/`me-`/`ps-`/`pe-`) for RTL. `btn-primary` = one per screen. Status → `badge-success`/`error`/`warning`. Icons: `lucide-react`, `size-*` + `text-*`.
- assistant-ui/Tool UI ship their own pre-built kits (AI Elements, shadcn-chatbot-kit), but those are shadcn-based — we don't use them, since we're DaisyUI-only. We use assistant-ui's engine (streaming/threads) + Tool UI's Zod-validated tool-call routing, pointed at our own `shared/` components instead.

## Stores (Zustand)

Client-only state — UI (sidebar, active tab, balance visibility, view mode), session (`use-auth-store` — in-memory access/refresh tokens), and preferences (`use-data-source-store`, `use-time-format-store`). Never server data — that's `queries/`. One small store per concern in `app/store/`, no provider needed. Most preference stores persist to `localStorage`.

## Known quirks — ignore these

`envFile deprecated` / babel `filter` warnings → upstream bugs. `@react-router/node` + `isbot` are required deps, don't remove. `eslint-plugin-react-hooks` pinned to `6.1.1` (7.x crash bug). pnpm pinned to `11.10.0` exactly — required for `pnpm-workspace.yaml`'s supply-chain settings. The plain `Dockerfile` is broken/unused (real builds are `Dockerfile.dev`/`Dockerfile.prod`).
