# Frontend Architecture Guide

> **Audience:** First-time contributors to this repo.  
> **Goal:** Understand every important folder, how they connect, and where to make changes — before touching a single line of code.

---

## Table of contents

1. [Tech stack at a glance](#1-tech-stack-at-a-glance)
2. [Annotated folder map](#2-annotated-folder-map)
3. [The data pipeline: api → queries → components](#3-the-data-pipeline)
4. [Constants and business rules (`lib/constants/`)](#4-constants-and-business-rules)
5. [TypeScript types (`types/`)](#5-typescript-types)
6. [Zustand stores (`store/`)](#6-zustand-stores)
7. [Routing (`routes.ts` + `routes/`)](#7-routing)
8. [Internationalization (`i18n/`)](#8-internationalization)
9. [Bank logos, names, and metadata (`lib/banks.ts`)](#9-bank-logos-names-and-metadata)
10. [Scripts (`scripts/`)](#10-scripts)
11. ["Where do I edit…?" quick reference](#11-where-do-i-edit)

---

## 1. Tech stack at a glance

| Concern             | Library                         | Notes                                                    |
| ------------------- | ------------------------------- | -------------------------------------------------------- |
| Routing + framework | React Router v7 (SPA mode)      | `ssr: false`; no server rendering                        |
| UI components       | DaisyUI v5 on Tailwind v4       | Semantic class names only; no raw hex                    |
| Server state        | TanStack Query v5               | All fetched data lives here, never in Zustand            |
| Client state        | Zustand v5                      | UI prefs, auth flag, onboarding form                     |
| Forms               | React Hook Form + Zod           | Validation schemas co-located with forms                 |
| i18n                | i18next + react-i18next         | English + Arabic; 15 namespace JSON files each           |
| HTTP                | axios                           | Single `apiClient` instance; auto-refresh on 401         |
| AI chat             | assistant-ui                    | Streaming threads; tool calls rendered by `chat/tools/`  |
| Icons               | lucide-react                    | All icons from this library; `size-*` + `text-*` classes |
| Fonts               | Inter (Latin), Tajawal (Arabic) | Loaded via `@fontsource` packages                        |

---

## 2. Annotated folder map

```
app/
├── routes.ts              ← ROUTE REGISTRY: every URL lives here
├── routes/                ← one file per page or layout guard
│
├── api/                   ← real HTTP calls (axios, no React)
├── queries/               ← TanStack Query hooks (ONLY data layer components import)
│
├── types/                 ← TypeScript interfaces + domain-level constants
├── store/                 ← Zustand stores (UI/session state only)
│
├── lib/
│   ├── constants/         ← named constant files (the single source of truth)
│   ├── banks.ts           ← bank codes, names, logos, fuzzy matching
│   ├── format.ts          ← date/time/money/number formatters
│   ├── toast.ts           ← imperative toast helpers
│   ├── z-index.ts         ← stacking order constants
│   ├── query-client.ts    ← TanStack Query singleton (reads from constants/)
│   ├── onboarding-fields.ts ← step field lists + dirty/complete logic
│   ├── demo-financials.ts ← chat tool placeholder data
│   └── use-*.ts           ← custom hooks (not tied to server state)
│
├── components/
│   ├── shared/            ← prop-driven, fetch-free; used by pages AND chat tools
│   │   ├── auth/          ← route guards (RequireAuth, RequireGuest, RestoringScreen)
│   │   ├── forms/         ← BankPicker, DateField, MoneyInput, ToggleSwitch…
│   │   ├── layout/        ← AppLayout, DataToolbar, Sidebar parts, Pagination…
│   │   ├── modals/        ← BaseModal, ConfirmDialog, SessionExpiredModal…
│   │   ├── preferences/   ← ThemeToggle, LanguageSwitcher, AccessibilityMenu…
│   │   └── skeletons/     ← loading placeholder skeletons
│   ├── chat/              ← AI chat UI + tool renderers
│   ├── dashboard/         ← dashboard widgets
│   ├── transactions/      ← transaction form fields
│   ├── accounts/          ← account card components
│   ├── bank-statements/   ← statement upload + review
│   ├── onboarding/        ← multi-step onboarding step components
│   └── profile/           ← profile page sections
│
├── i18n/
│   ├── index.ts           ← i18next initialization
│   └── locales/
│       ├── en/            ← English (15 namespace JSON files)
│       └── ar/            ← Arabic (must mirror en/ key-for-key)
│
├── root.tsx               ← React Router root (providers, global error boundary)
└── app.css                ← global styles + DaisyUI/Tailwind theme tokens

scripts/                   ← CI/pre-commit checks (Node scripts + shell)
public/
└── banks/                 ← bank logo PNGs, named exactly by bank code (e.g. NBE.png)
```

---

## 3. The data pipeline

This is the most important architecture rule. **Every component must follow this path:**

```
Component
  │
  └─► queries/*.ts    (useAccounts, useTransactions, useDeleteAccount, …)
        │
        └─► api/*.ts  →  Django REST API
```

There used to be a mock/live data-source toggle (`mocks/*.ts` + `pickImpl`), letting the app run against fake in-memory data instead of the backend. It was removed (see `git log --grep="mock data source"`) so every user always talks to the real backend. If you see either term in an older doc or PR, it no longer applies.

### `api/` — real HTTP calls

- **One file per domain:** `accounts.ts`, `auth.ts`, `bank-statements.ts`, `budget.ts`, `dashboard.ts`, `goals.ts`, `profile.ts`, `transactions.ts`.
- All calls go through `api/client.ts` — a single axios instance that:
  - Reads `VITE_API_BASE_URL` from the environment.
  - Appends a trailing slash automatically (Django requirement).
  - Injects `Authorization: Bearer <token>` from `useAuthStore` (read via `getState()`, not a hook).
  - Intercepts 401 responses, attempts a silent token refresh via `POST /auth/refresh` (httpOnly cookie), and retries the original request. If refresh fails, the session is expired.
- All backend endpoint paths live in `lib/constants/api.ts` as `API_ENDPOINTS`. **Never hardcode a URL string inside an `api/` function.**

### `queries/` — the only layer components import

- One file per domain, matching `api/`.
- The pattern every query file follows:

```ts
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () => accountsApi.getAccounts(),
  });
}
```

- Mutations use `useInvalidatingMutation` from `queries/shared.ts`, which automatically:
  1. Runs the mutation.
  2. Invalidates the specified query keys on success.
  3. Shows a success toast (by i18n key).
  4. Shows an error toast on failure.

```ts
export function useDeleteAccount() {
  return useInvalidatingMutation({
    mutationFn: (id: string) => accountsApi.deleteAccount(id),
    invalidates: [[QUERY_ROOTS.accounts], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.accountDeleted",
  });
}
```

- Query key **roots** live in `lib/constants/query-keys.ts` as `QUERY_ROOTS`. Always use these — never write a raw string key.

---

## 4. Constants and business rules

### `lib/constants/` — the single source of truth

Every magic number, string literal, and configurable value must live here. **Nothing that is used in more than one place should be hardcoded inline.**

| File                 | What it holds                                                                        |
| -------------------- | ------------------------------------------------------------------------------------ |
| `api.ts`             | `API_ENDPOINTS` — all backend URL paths                                              |
| `routes.ts`          | `ROUTE_SEGMENTS` — URL path segments; `localizedPath()` builder                      |
| `storage-keys.ts`    | `STORAGE_KEYS` — all `localStorage` key strings (`nbe_*` prefix)                     |
| `query-keys.ts`      | `QUERY_ROOTS` — TanStack Query cache key roots                                       |
| `limits.ts`          | Numeric min/max/step for forms; retry counts; `BYTES_PER_KB`                         |
| `time.ts`            | Millisecond durations: toast, ripple, debounce, stale time                           |
| `options.ts`         | `EMPLOYMENT_OPTIONS`, `STEADINESS_OPTIONS`, `NAME_SUGGESTIONS` — select option lists |
| `accessibility.ts`   | Font-scale bounds (`MIN_SCALE`, `MAX_SCALE`, `SCALE_STEP`, `DEFAULT_SCALE`)          |
| `layout.ts`          | Sidebar pixel bounds (`MIN_SIDEBAR_WIDTH`, `MAX_SIDEBAR_WIDTH`)                      |
| `category-colors.ts` | DaisyUI bar colors + oklch chart palettes (light/dark/high-contrast)                 |
| `category-icons.tsx` | `CATEGORY_ICONS` map — one Lucide icon per budget category                           |

### How a constant change propagates

Because every consumer imports from the same file, changing one value updates the whole app. Example:

```
lib/constants/time.ts
  QUERY_STALE_TIME_MS = 30_000
         │
         ▼
  lib/query-client.ts  (queryClient staleTime)
         │
         ▼
  Every useQuery() call in queries/*.ts
         │
         ▼
  Every data-fetching component in the app
```

### Values that must never be hardcoded

- ❌ API paths (use `API_ENDPOINTS`)
- ❌ Route segments (use `ROUTE_SEGMENTS`)
- ❌ `localStorage` keys (use `STORAGE_KEYS`)
- ❌ Query cache keys (use `QUERY_ROOTS`)
- ❌ Durations / timeouts (use constants in `time.ts`)
- ❌ Form min/max/step values (use `limits.ts`)
- ❌ Hex colors in `.ts`/`.tsx`/`.css` (use DaisyUI semantic classes or CSS variables)
- ❌ Z-index numbers (use `Z_DROPDOWN`, `Z_POPOVER`, `Z_FLOATING_ACTION`, `Z_TOOLTIP` from `lib/z-index.ts`)

### Adding a new constant

1. Identify which file in `lib/constants/` the value belongs to (or create a new file if it is a genuinely new concern).
2. Export it with a `SCREAMING_SNAKE_CASE` name.
3. Import it wherever it is needed — never duplicate the value.

---

## 5. TypeScript types

`app/types/` holds all shared TypeScript interfaces. One file per domain.

| File                | Key types                                                                      |
| ------------------- | ------------------------------------------------------------------------------ |
| `account.ts`        | `BankAccount`, `CreateBankAccountBody`, `ACCOUNT_TYPES`, `CURRENCIES`          |
| `auth.ts`           | Auth request/response shapes                                                   |
| `transaction.ts`    | `Transaction`, `TRANSACTION_CATEGORIES`, `INCOME_CATEGORIES`, `AMOUNT_RANGES`  |
| `bank-statement.ts` | `BankStatement`, `BankStatementStatus`, `BANK_STATEMENT_STATUS`, upload limits |
| `budget.ts`         | Budget plan and allocation interfaces                                          |
| `dashboard.ts`      | Dashboard summary interfaces                                                   |
| `goal.ts`           | Savings goal interface                                                         |
| `profile.ts`        | User profile interface                                                         |

### Important: domain constants in `types/`

Some `types/` files export constants that are part of the domain contract, not just type metadata. Key examples:

- **`TRANSACTION_CATEGORIES`** (`types/transaction.ts`) — the exact string values the backend uses to match transactions to budget buckets. **Case-sensitive.** If a transaction's category doesn't match one of these values exactly, the backend silently ignores it for budget tracking. Never add or rename without a coordinated backend change.
- **`INCOME_CATEGORIES`** — separate vocabulary for income transactions.
- **`AMOUNT_RANGES`** — preset filter buckets for the amount filter UI.
- **`ACCOUNT_TYPES`**, **`CURRENCIES`** — valid values for account creation.

---

## 6. Zustand stores

Stores hold **client-only state**. Server data (accounts, transactions, etc.) lives exclusively in the TanStack Query cache, never in a store.

### Store anatomy

Every store follows this pattern:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

export const useExampleStore = create<State>()(
  persist(
    (set) => ({/* initial state + actions */}),
    { name: STORAGE_KEYS.example }, // localStorage key from constants
  ),
);
```

No Provider is needed — Zustand stores are module-level singletons.

### Auth store (`use-auth-store`)

Critical design decision: **the access token is in memory only**.

```
localStorage (nbe_auth)
  └── isAuthenticated: boolean   ← only this is persisted

In-memory (module variable)
  └── accessToken: string | null ← never touches localStorage
```

On reload: `isAuthenticated` is restored from localStorage → `use-session-gate.ts` calls `POST /auth/refresh` → a new access token is returned via the httpOnly cookie and stored in memory.

The `sessionExpired` flag triggers the "Session Expired" modal when the refresh cookie is missing.

### Display preferences store (`use-display-preferences-store`)

All display preferences — view mode, density, number/date/time format, compact numbers, balance visibility — are consolidated into one persisted store under one `localStorage` key (`nbe_display_preferences`). The store validates each field on hydration via a custom `merge` function that rejects invalid values rather than letting corrupt data flow through to components.

---

## 7. Routing

### `routes.ts` — the route registry

All routes are defined in a single file using React Router's typed `RouteConfig` API.

```
/ (root-redirect.tsx)       ← detects language, redirects to /:lang/
  │
  └── lang-layout.tsx       ← sets html lang + dir (LTR/RTL)
        │
        ├── require-guest.tsx           ← redirects logged-in users to dashboard
        │     ├── /:lang               (splash.tsx)
        │     ├── /:lang/onboarding    (onboarding.tsx)
        │     └── /:lang/sign-in       (sign-in.tsx)
        │
        ├── require-auth.tsx            ← redirects unauthenticated users to splash
        │     └── app-layout.tsx        ← sidebar + topbar shell
        │           ├── /:lang/dashboard
        │           ├── /:lang/chat
        │           ├── /:lang/transactions
        │           ├── /:lang/bank-statements
        │           └── /:lang/profile
        │
        └── /:lang/*         (not-found.tsx)
```

### URL segments

All URL segments are defined in `lib/constants/routes.ts`:

```ts
export const ROUTE_SEGMENTS = {
  dashboard: "dashboard",
  chat: "chat",
  transactions: "transactions",
  bankStatements: "bank-statements",
  profile: "profile",
  onboarding: "onboarding",
  signIn: "sign-in",
} as const;
```

`routes.ts` imports `ROUTE_SEGMENTS` and uses them. Never write a raw URL string in `routes.ts`.

### Building links in components

Use the `localizedPath()` helper:

```ts
import { localizedPath } from "@/lib/constants/routes";
import { ROUTE_SEGMENTS } from "@/lib/constants/routes";

const href = localizedPath(lang, ROUTE_SEGMENTS.dashboard); // → "/en/dashboard"
```

### Layout guards

- `require-guest.tsx` — uses `useAuthStore` to check `isAuthenticated`. Redirects authenticated users to the dashboard.
- `require-auth.tsx` — redirects unauthenticated users to the splash page.
- The guards are thin wrappers that render `<Outlet />` if the condition passes.

---

## 8. Internationalization

### Structure

```
app/i18n/
├── index.ts                  ← configures i18next with all namespace files
└── locales/
    ├── en/                   ← English (source of truth)
    │   ├── app.json          ← app-level strings (am/pm, etc.)
    │   ├── auth.json         ← sign-in/onboarding strings
    │   ├── bankStatements.json
    │   ├── chat.json
    │   ├── common.json       ← shared strings (category names, button labels)
    │   ├── dashboard.json
    │   ├── finance.json
    │   ├── nav.json          ← navigation labels
    │   ├── settings.json
    │   ├── toast.json        ← toast messages
    │   ├── transactions.json
    │   └── …
    └── ar/                   ← Arabic (must mirror en/ key-for-key)
```

### Rules

1. **Every key added to `en/` must be added to `ar/` immediately.** `pnpm check:i18n` (which runs `scripts/check-i18n-parity.mjs`) will fail if there is any mismatch.
2. **Every `t("key")` call must resolve to an existing key.** `scripts/check-i18n-usage.mjs` scans all `.ts`/`.tsx` files for `t("...")` calls and verifies each key exists in the English locale.
3. Category display names live in `common.json` under `categories.*`. The stored values (e.g. `"Housing"`) are in `TRANSACTION_CATEGORIES` in `types/transaction.ts`; the display names are the translations.
4. Bank names are in `common.json` under `banks.*` — keyed by bank code (e.g. `banks.NBE`).

### RTL support

The `lang-layout.tsx` route sets `<html lang="..." dir="...">` on every navigation. Components must use **logical CSS properties** (`ms-`, `me-`, `ps-`, `pe-`) instead of directional ones (`ml-`, `mr-`, `pl-`, `pr-`) so layouts mirror correctly in Arabic.

---

## 9. Bank logos, names, and metadata

Bank data is centralized in **`app/lib/banks.ts`**. This is the single source of truth for every bank displayed anywhere in the app.

### Structure

```ts
// The master registry: bank code → full commercial name
export const BANK_NAMES: Record<string, string> = {
  NBE: "National Bank of Egypt",
  CIB: "Commercial International Bank",
  // … 50+ banks
};

// Resolves a display name from a bank code
export function getBankName(bankCode?: string): string | undefined;

// Resolves a bank code from either a code ("NBE"), a full name
// ("National Bank of Egypt"), or a fuzzy near-match ("HSBC Egypt")
export function getBankCode(bank?: string): string | undefined;

// Returns the logo path from public/banks/, or the fallback
export function getBankLogo(bankCode?: string): string;

// React hook: resolves logo + localized name from a code or name
export function useBankInfo(bank?: string): { code; label; logo };
```

### Logo files

```
public/banks/
├── NBE.png
├── CIB.png
├── BM.png
└── …           ← named EXACTLY after the bank code
```

The fallback for unknown banks is `public/banks/unknown.png`.

### How it flows through the app

```
Backend returns bank_name: "National Bank of Egypt"  (from GET /accounts)
  or bank code: "NBE"                                 (from GET /statements)
         │
         ▼
  getBankCode("National Bank of Egypt")
    → exact match in CODES_BY_NAME → "NBE"
         │
         ▼
  getBankLogo("NBE")  → "/banks/NBE.png"
  useBankInfo("NBE")  → { code: "NBE", label: t("banks.NBE"), logo: "/banks/NBE.png" }
         │
         ▼
  <BankBadge> / <BankPicker> / account cards / statement rows
```

`getBankCode()` handles fuzzy matching so backend inconsistencies (different casing, word order, missing articles like "The") don't break logo resolution.

### Adding a new bank

1. Add an entry to `BANK_NAMES` in `app/lib/banks.ts`: `CODE: "Full Commercial Name"`.
2. Add the logo file as `public/banks/CODE.png`.
3. Add the localized name to both `app/i18n/locales/en/common.json` and `ar/common.json` under `banks.CODE`.
4. Run `pnpm check:i18n` to verify locale parity.

---

## 10. Scripts

All CI scripts live in `scripts/`. They are Node ESM scripts or shell scripts — not bundled by Vite.

### `scripts/check-i18n-parity.mjs`

**What it does:** Compares every key in every namespace JSON file across all locale directories. Fails if any key exists in one locale but not another.

**Why it exists:** English and Arabic must always be in sync. A missing Arabic key falls back to the English string, but a missing English key shows the raw key string in the UI. This script catches both.

**Run:** `pnpm check:i18n` (also runs `check-i18n-usage.mjs`)

### `scripts/check-i18n-usage.mjs`

**What it does:** Walks all `.ts`/`.tsx` files in `app/`, extracts every `t("literal.key")` call, and verifies each key exists in the English locale files. Supports i18next plural forms (`key_one`, `key_other`, etc.).

**Why it exists:** Prevents deploying with broken translation calls that would show raw key strings to users.

**Limitation:** Dynamic keys (`t(someVariable)`) cannot be statically checked and are skipped.

### `scripts/check-no-hardcoded-hex.sh`

**What it does:** Greps the staged diff (pre-commit) or PR diff (CI) for `#RRGGBB`-style hex color literals in `.ts`, `.tsx`, and `.css` files (excluding `app/app.css` which defines the theme tokens).

**Why it exists:** DaisyUI's semantic classes and CSS variables are theme-aware (light/dark/high-contrast). A hardcoded hex bypasses the theming system and will look wrong in at least one theme.

**Enforced at:** Pre-commit (staged diff) and CI (PR diff).

---

## 11. "Where do I edit…?" quick reference

### Add a new bank

→ `app/lib/banks.ts` (BANK_NAMES) + `public/banks/CODE.png` + both `i18n/locales/*/common.json` under `banks.CODE`

### Change a route URL

→ `app/lib/constants/routes.ts` (ROUTE_SEGMENTS) — `routes.ts` and all `localizedPath()` calls update automatically

### Add a new page / route

→ Create `app/routes/my-page.tsx`, register in `app/routes.ts` using `ROUTE_SEGMENTS`, add i18n strings

### Add a new API endpoint

→ `app/lib/constants/api.ts` (API_ENDPOINTS) → `app/api/domain.ts` (function) → `app/queries/domain.ts` (hook)

### Add or change a type

→ `app/types/<domain>.ts` — update the interface there; TypeScript will surface all call sites that need updating

### Add a constant (timeout, limit, label list, etc.)

→ Find the right file in `app/lib/constants/` (or create a new file), export with `SCREAMING_SNAKE_CASE`

### Change the TanStack Query stale time or retry count

→ `app/lib/constants/time.ts` (`QUERY_STALE_TIME_MS`) and `app/lib/constants/limits.ts` (`QUERY_RETRY_COUNT`) — `app/lib/query-client.ts` reads them automatically

### Change a toast duration or debounce delay

→ `app/lib/constants/time.ts`

### Add a new transaction category

→ `TRANSACTION_CATEGORIES` in `app/types/transaction.ts` + `CATEGORY_ICONS` in `app/lib/constants/category-icons.tsx` + both locale files (`common.json` under `categories.*`) — **must also be recognized by the backend**

### Add a new user preference

→ Add state + setter to `app/store/use-display-preferences-store.ts` (or `use-accessibility-store.ts`) and add a UI toggle in `app/components/shared/preferences/`

### Add a translation string

→ `app/i18n/locales/en/<namespace>.json` AND `app/i18n/locales/ar/<namespace>.json` — both files at the same time, or `pnpm check:i18n` will fail

### Change a localStorage key name

→ `app/lib/constants/storage-keys.ts` — **warning:** changing a key value orphans existing persisted data in users' browsers; bump the store's `version` number if the shape also changed

### Add a new Zustand store

→ Create `app/store/use-<concern>-store.ts`, add the `localStorage` key to `STORAGE_KEYS` in `app/lib/constants/storage-keys.ts`, import via hook in components (no Provider needed)

### Change the AI chat tool list

→ `app/components/chat/tools/` — add a new tool renderer and register it in `tools/index.ts`

### Add a new sidebar nav item

→ `app/components/shared/layout/SidebarNav.tsx` + add the route in `routes.ts` + add `nav.json` strings for both locales

---

## Cross-reference map

```
A component needs data
  └─► queries/*.ts
        └─► api/*.ts
              └─► types/*.ts (argument/return types)
                    └─► lib/constants/api.ts (URL paths)
                          └─► api/client.ts (axios, auth, refresh)
                                └─► store/use-auth-store.ts (token)
                                      └─► lib/constants/storage-keys.ts (key names)

A component shows a bank
  └─► lib/banks.ts (useBankInfo)
        └─► i18n/locales/*/common.json (banks.*)
              └─► public/banks/*.png (logo files)

A component shows a category
  └─► types/transaction.ts (TRANSACTION_CATEGORIES)
        └─► lib/constants/category-icons.tsx (CATEGORY_ICONS)
        └─► lib/constants/category-colors.ts (useCategoryColorVars)
        └─► i18n/locales/*/common.json (categories.*)

A component formats money or dates
  └─► lib/format.ts (formatMoney, formatDate, formatNumber…)
        └─► store/use-display-preferences-store.ts (numberFormat, dateFormat…)
              └─► lib/constants/storage-keys.ts

A new route URL
  └─► lib/constants/routes.ts (ROUTE_SEGMENTS)
        └─► routes.ts (route registration)
        └─► lib/constants/routes.ts (localizedPath)
              └─► components that build <Link href>
```
