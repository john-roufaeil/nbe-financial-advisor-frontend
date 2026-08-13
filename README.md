# NBE Financial Advisor — Frontend

React Router v7 (SPA) · TypeScript · Tailwind v4 / DaisyUI v5 · TanStack Query v5 · Zustand v5 · i18next (en/ar) · assistant-ui (AI chat)

---

## Quick start

The fastest way to run this app is the full stack via Docker — one command
brings up the frontend, the Django backend, the AI service, and every
supporting service (Postgres, Redis, object storage, mock bank) together.
Running the frontend alone against Node is the alternative for frontend-only
work with a backend already running elsewhere.

### Option A — Docker (recommended, full stack)

The compose files live in `nbe-financial-advisor-backend/deploy/`, not this
repo. Requires this repo and `nbe-financial-advisor-ai-service` checked out
as sibling directories next to `nbe-financial-advisor-backend`:

```bash
# 1. Copy .env.example → .env in this repo, ../nbe-financial-advisor-backend,
#    and ../nbe-financial-advisor-ai-service (all three are required)
cp .env.example .env

# 2. Bring up the whole stack (hot reload on backend/frontend/ai-service)
cd ../nbe-financial-advisor-backend/deploy
docker compose -f docker-compose.dev.yml up -d --build

# 3. Open http://localhost:5173
```

Full details — service list, `.env` files explained, prod compose, data
persistence — live in
[nbe-financial-advisor-backend/deploy/DOCKER.md](../nbe-financial-advisor-backend/deploy/DOCKER.md).

### Option B — Node only (frontend against an already-running backend)

```bash
# 1. Use the pinned Node version (Node ≥ 22 required)
nvm use 22                     # or: echo 'cd() { builtin cd "$@"; [ -f .nvmrc ] && nvm use --silent; }' >> ~/.bashrc

# 2. Enable the pinned package manager
corepack enable && corepack prepare pnpm@11.10.0 --activate

# 3. Install dependencies
pnpm install

# 4. Set the API base URL
cp .env.example .env.local
# Edit .env.local — set VITE_API_BASE_URL to your backend address

# 5. Start the dev server (http://localhost:5173)
pnpm dev
```

### Environment variables

| Variable            | Required | Description                                                  |
| ------------------- | -------- | ------------------------------------------------------------ |
| `VITE_API_BASE_URL` | ✅       | Base URL of the Django backend, e.g. `http://localhost:8000` |

---

## Scripts

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | Vite dev server with HMR                           |
| `pnpm build`        | Production bundle via React Router                 |
| `pnpm typecheck`    | Regenerates RR type stubs + runs `tsc`             |
| `pnpm lint`         | ESLint (zero warnings allowed)                     |
| `pnpm lint:fix`     | ESLint with auto-fix                               |
| `pnpm format`       | Prettier write                                     |
| `pnpm format:check` | Prettier check (CI)                                |
| `pnpm check:i18n`   | Verify locale key parity + all `t()` calls resolve |

**Pre-commit (Husky + lint-staged)** auto-runs lint + format on staged `*.ts`/`*.tsx` files.

**Before opening a PR**, make sure these all pass locally:

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm check:i18n
bash scripts/check-no-hardcoded-hex.sh
```

---

## Authentication

All data calls hit the real Django API — there is no mock/offline mode (it was removed; every request needs a running backend at `VITE_API_BASE_URL`).

**Auth note:** Access tokens are held **in memory only** — they are never written to `localStorage`. On a page reload, the app silently calls `POST /auth/refresh` using the httpOnly refresh cookie. If the cookie is missing or expired, the user is shown a "session expired" modal.

---

## Folder structure

```
app/
├── routes.ts              # Route registry — every page is registered here
├── routes/                # One file per page/layout (dashboard, chat, sign-in…)
├── components/
│   ├── shared/            # Prop-driven, data-free components used by pages AND chat tools
│   │   ├── auth/          # RequireAuth, RequireGuest, RestoringScreen guards
│   │   ├── forms/         # BankPicker, DateField, MoneyInput, ToggleSwitch…
│   │   ├── layout/        # AppLayout, AuthLayout, DataToolbar, Sidebar pieces
│   │   ├── modals/        # BaseModal, ConfirmDialog, SessionExpiredModal…
│   │   ├── preferences/   # ThemeToggle, LanguageSwitcher, AccessibilityMenu…
│   │   └── skeletons/     # Loading placeholder skeletons
│   ├── chat/              # AI chat scaffolding + tool renderers (chat/tools/)
│   ├── dashboard/         # Dashboard-specific widgets
│   ├── transactions/      # Transaction form fields
│   ├── accounts/          # Account card components
│   ├── bank-statements/   # Statement list + review flow
│   ├── onboarding/        # Multi-step onboarding step components
│   └── profile/           # Profile page sections
├── api/                   # Real backend calls via axios (one file per domain)
├── queries/               # TanStack Query hooks — the ONLY import point for data
├── types/                 # TypeScript interfaces, shared enums, domain constants
├── store/                 # Zustand stores — client-only UI/session state
├── lib/                   # Pure utilities, custom hooks, and constants
│   └── constants/         # Named constant files (api, routes, limits, time…)
├── i18n/
│   ├── index.ts           # i18next setup
│   └── locales/
│       ├── en/            # English translations (15 namespace JSON files)
│       └── ar/            # Arabic translations (must mirror en/ exactly)
├── root.tsx               # React Router root (providers, global error boundary)
└── app.css                # Global styles, Tailwind + DaisyUI theme tokens
```

---

## Data flow

```
Component
  └─► queries/*.ts         (useAccounts, useTransactions, …)
        └─► api/*.ts
```

- **`api/`** — plain async functions; each hits the real backend via the shared `apiClient` (axios with auto Bearer token + refresh-on-401 interceptor in `api/client.ts`). No React.
- **`queries/`** — the only layer components import. Owns query keys, cache invalidation, and success/error toasts.

> **Rule:** Never import `api/` directly in a component. Always go through `queries/`.

---

## Adding a page

1. Create `app/routes/my-page.tsx`.
2. Register it in `app/routes.ts` inside the correct layout tier (`require-guest`, `require-auth`, or `app-layout`). Use `ROUTE_SEGMENTS` from `lib/constants/routes.ts` for the URL segment — never a raw string.
3. Add translation strings to **both** `app/i18n/locales/en/*.json` and `app/i18n/locales/ar/*.json` — `pnpm check:i18n` will fail if they're missing or out of sync.
4. Fetch data via a `queries/` hook, not a raw `useEffect`. Use React Hook Form + Zod for forms.

---

## Styling rules

- **DaisyUI semantic classes only** — never hardcoded hex colors (`#...`). CI enforces this via `scripts/check-no-hardcoded-hex.sh`.
- **Logical CSS properties** for RTL support: use `ms-`/`me-`/`ps-`/`pe-` instead of `ml-`/`mr-`/`pl-`/`pr-`.
- **One `btn-primary` per screen**. Use `badge-success`/`badge-error`/`badge-warning` for status.
- **Icons:** `lucide-react` with `size-*` + `text-*` classes.

---

## Stores (Zustand)

Client-only state only — **no server data in stores**. All server data lives in the TanStack Query cache.

| Store                           | Purpose                                                     | Persisted               |
| ------------------------------- | ----------------------------------------------------------- | ----------------------- |
| `use-auth-store`                | `isAuthenticated` flag + in-memory access token             | Flag only (never token) |
| `use-display-preferences-store` | View mode, density, number/date/time format, balance hidden | ✅                      |
| `use-theme-store`               | Light / dark / system                                       | ✅                      |
| `use-accessibility-store`       | Font scale, high contrast, reduced motion                   | ✅                      |
| `use-language-switch-store`     | Pending language change state                               | ❌                      |
| `use-onboarding-store`          | Multi-step onboarding form state                            | ✅                      |
| `use-sidebar-store`             | Collapsed state, width                                      | ✅                      |
| `use-page-size-store`           | Rows-per-page preference                                    | ✅                      |
| `use-toast-store`               | Active toast message (UI only)                              | ❌                      |
| `use-confirm-store`             | Confirm dialog state (UI only)                              | ❌                      |
| `use-chat-store`                | Active chat thread state                                    | ❌                      |
| `use-drawer-store`              | Mobile drawer open state                                    | ❌                      |
| `use-route-announcer-store`     | Accessibility route announcements                           | ❌                      |

---

## Known quirks

- `envFile deprecated` / babel `filter` warnings → upstream bugs in dependencies; safe to ignore.
- `@react-router/node` + `isbot` are required deps (React Router internals); do not remove.
- `eslint-plugin-react-hooks` pinned to `6.1.1` — 7.x has a known crash bug.
- `pnpm` pinned to `11.10.0` exactly — required for `pnpm-workspace.yaml` supply-chain settings.
- The plain `Dockerfile` is **broken/unused**. Real builds use `Dockerfile.dev` (development) and `Dockerfile.prod` (production).
