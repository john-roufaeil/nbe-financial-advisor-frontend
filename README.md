# NBE Financial Advisor — Frontend

React Router v7 (SPA) · TypeScript · Tailwind v4/DaisyUI · i18next (en/ar)

## Setup

```bash
nvm use && corepack enable && corepack prepare pnpm@11.10.0 --activate
pnpm install
cp .env.example .env.local
pnpm dev          # → localhost:5173, redirects to /en
```

Or: `docker compose up` (no local Node needed, hot reload via volume mount).

## Scripts

`dev` `build` `lint` `lint:fix` `format` `format:check` `typecheck` `check:i18n` — self-explanatory. Pre-commit hook auto-runs lint+format on staged files.

## Folder structure

```
app/
  routes.ts            ← register every route here
  routes/               one file per page
  root.tsx              providers, error boundary
  app.css                theme tokens, DaisyUI config
  i18n/locales/{en,ar}/common.json
  lib/query-client.ts    TanStack Query client
  store/                 Zustand stores
  schemas/                Zod schemas
```

## Add a page

1. New file in `app/routes/`, default-export a component.
2. Register it in `app/routes.ts`: `route(":lang/yourpage", "routes/yourpage.tsx")` inside the existing `layout(...)` array.
3. Add any new strings to **both** `en/common.json` and `ar/common.json` — `pnpm check:i18n` (also runs in CI) fails if they don't match.
4. Server data → TanStack Query (`useQuery`, see `app/lib/query-client.ts`), never `useEffect` fetch. Forms → React Hook Form + Zod (see `app/schemas/example.schema.ts`).

## Add a component

Shared → `app/components/`. Feature-only → co-locate next to the route.

- DaisyUI classes only, **never hardcoded hex** (CI checks this).
- Logical properties for spacing: `ms-`/`me-`/`ps-`/`pe-`, not `ml-`/`mr-`/`pl-`/`pr-` (RTL support).
- `btn-primary` = one per screen, max.
- Status → `badge-success`/`error`/`warning`, never brand colors.
- Icons: `lucide-react`, size via `size-*`, color via `text-*` (e.g. `<Wallet className="size-5 text-primary" />`).

## Stores (Zustand)

UI-only state (sidebar, active tab, wizard step) — **not** server data, that's always TanStack Query. One small store per concern. Example: `app/store/use-ui-store.ts`. Usage: `const { isSidebarOpen, toggleSidebar } = useUIStore();` — no provider needed.

## Git / PRs

- `main` protected, PRs only, squash-merge.
- Branches: `feat/…` `fix/…` `chore/…`
- PR template auto-fills — fill in "How to verify."
- CI: lint + typecheck + build (DevOps) + i18n-parity/hex-color checks (frontend).

## Known quirks — ignore these

- `envFile deprecated` / babel `filter` warnings on `pnpm dev` → upstream bugs, not us.
- `@react-router/node` + `isbot` are required deps (framework's default entry template needs them) — don't remove.
- `eslint-plugin-react-hooks` pinned to `6.1.1` (7.x has a crash bug upstream).
- pnpm pinned to `11.10.0` exactly (`packageManager` field) — required for `pnpm-workspace.yaml`'s supply-chain settings to work.
