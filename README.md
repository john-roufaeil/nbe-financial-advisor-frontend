# NBE Financial Advisor — Frontend

React Router v7 (SPA) · TypeScript · Tailwind v4/DaisyUI · i18next (en/ar) · assistant-ui + Tool UI (chat)

## Setup

```bash
# once, so new terminals auto-load the right Node version
echo 'cd() { builtin cd "$@"; [ -f .nvmrc ] && nvm use --silent; }' >> ~/.bashrc && source ~/.bashrc

corepack enable && corepack prepare pnpm@11.10.0 --activate
pnpm install
cp .env.example .env.local
pnpm dev          # → localhost:5173, redirects to /en
```

Or: `docker build -f Dockerfile.dev -t frontend-dev . && docker run --rm -it -p 5173:5173 -v "$(pwd)":/app -v /app/node_modules --env-file .env.local frontend-dev`

## Scripts

`dev` `build` `lint` `lint:fix` `format` `format:check` `typecheck` `check:i18n`. Pre-commit hook (Husky) auto-runs lint+format+i18n+hex-color checks on every commit.

## Folder structure

```
app/
  routes.ts              register every route here
  routes/                 dashboard, chat, onboarding/*, one file (or folder) per page
  components/
    shared/                cross-context display components — reused by pages AND chat
    chat/                   chat-only scaffolding (bubbles, input bar)
  chat/tool-renderers.tsx  maps LLM tool-call payloads → shared/ components
  root.tsx, app.css, i18n/, lib/query-client.ts, store/, schemas/
```

## Add a page

1. File in `app/routes/`, register in `app/routes.ts` inside the `layout(...)` array.
2. Add new strings to **both** `en/common.json` and `ar/common.json` — `pnpm check:i18n` fails otherwise.
3. Server data → TanStack Query, never `useEffect` fetch. Forms → React Hook Form + Zod. Multi-step flows (onboarding) → Zustand store for step state, one schema per step.

## Components — build once, use in both dashboard and chat

- **Shared, prop-driven, no fetching inside** → `app/components/shared/`. Dashboard pages feed them via TanStack Query; the chatbot feeds the _same_ component via `app/chat/tool-renderers.tsx` when the LLM calls a matching tool. Don't fork a component per context.
- Feature-only, one-off → co-locate next to its route.
- Chat-only scaffolding (message bubbles, input bar) → `app/components/chat/`.
- DaisyUI classes only, **never hardcoded hex** (CI-enforced). Logical properties (`ms-`/`me-`/`ps-`/`pe-`) for RTL. `btn-primary` = one per screen. Status → `badge-success`/`error`/`warning`. Icons: `lucide-react`, `size-*` + `text-*`.
- assistant-ui/Tool UI's own pre-built kits (AI Elements, shadcn-chatbot-kit) are shadcn-based — we don't use them, since we're DaisyUI-only. We use assistant-ui's engine (streaming/threads) + Tool UI's Zod-validated tool-call routing, pointed at our own `shared/` components instead.

## Stores (Zustand)

UI-only state (sidebar, active tab, onboarding step) — never server data, that's TanStack Query. One small store per concern, e.g. `app/store/use-drawer-store.ts`. No provider needed.

## Architecture audit

Everything currently runs on fixed demo data (`lib/demo-*.ts`, `store/use-*-store.ts`) — no backend calls yet.

**Safe to remove:**

- `Dockerfile` (the plain one) — broken (`npm run start` doesn't exist; uses npm not pnpm). Real builds are `Dockerfile.dev`/`Dockerfile.prod`.
- `lucide` dependency — unused; icons go through `lucide-react` only.

**Wired up for later, unused today:**

- `@tanstack/react-query` + `lib/query-client.ts` — provider is mounted in `root.tsx`, no `useQuery`/`useMutation` calls yet.
- `.env.example`'s `VITE_API_BASE_URL` — declared, not read anywhere.
- `schemas/example.schema.ts` — a documented reference template, not dead code (see Stores/Add-a-page above).
- `store/use-*-store.ts` (auth, chat, goals, onboarding, personal-data) — hold demo state now; built so swapping seed data/actions for real API calls shouldn't require touching the components that consume them.

**Missing for backend integration:**

- No API client/fetch wrapper (auth-token attachment, 401 handling).
- Auth is a `localStorage` boolean — no real token/session/refresh/logout request.
- No loading/error UI states anywhere (pages render demo data synchronously).
- No route `loader`/`action` or React Query usage yet.
- Goal/personal-data edits only persist to Zustand + localStorage, never sent anywhere.

## Known quirks — ignore these

`envFile deprecated` / babel `filter` warnings → upstream bugs. `@react-router/node` + `isbot` are required deps, don't remove. `eslint-plugin-react-hooks` pinned to `6.1.1` (7.x crash bug). pnpm pinned to `11.10.0` exactly — required for `pnpm-workspace.yaml`'s supply-chain settings.
