# NBE Financial Advisor — Frontend

React Router v7 (SPA mode) + TypeScript + Tailwind v4/DaisyUI + i18next (en/ar). This README is the practical "how do I actually work in this repo" guide.

---

## Getting started

```bash
nvm use               # Node 22, pinned in .nvmrc
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
cp .env.example .env.local   # fill in real values
pnpm dev
```

Opens at `http://localhost:5173`, redirects `/` → `/en`.

### Or via Docker (optional, for environment parity across the team)

```bash
docker compose up
```

Same result — hot reload included via volume mount, no need to have Node
installed locally at all if you'd rather not.

## Scripts

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Start dev server                                 |
| `pnpm build`        | Production build (static SPA)                    |
| `pnpm lint`         | ESLint, zero warnings allowed                    |
| `pnpm lint:fix`     | ESLint with auto-fix                             |
| `pnpm format`       | Prettier write                                   |
| `pnpm format:check` | Prettier check                                   |
| `pnpm typecheck`    | React Router typegen + `tsc`                     |
| `pnpm check:i18n`   | Verify `en`/`ar` locale files have matching keys |

A pre-commit hook (Husky + lint-staged) auto-fixes lint/format issues on
staged files automatically — you don't need to remember to run these
manually before committing, but it's good to run `pnpm lint` yourself while
actively working so you're not surprised at commit time.

---

## Folder structure

```
app/
  routes.ts              Route table — every route is registered here
  routes/                One file per route/page
    lang-layout.tsx       Wraps all routes, handles /:lang, RTL sync
    root-redirect.tsx     Redirects bare "/" to the default language
    dashboard.tsx         Example page
  root.tsx                Root layout: <html>, providers (Query, etc.), error boundary
  app.css                 Tailwind + DaisyUI theme config — brand colors, tokens
  i18n/
    index.ts              i18next setup
    locales/en/common.json
    locales/ar/common.json
  lib/
    query-client.ts       Shared TanStack Query client
  store/
    use-ui-store.ts        Example Zustand store
  schemas/
    example.schema.ts      Example Zod schema (RHF pairing)
scripts/
  check-i18n-parity.mjs         Used by pnpm check:i18n and CI
  check-no-hardcoded-hex.sh     Used by CI (PR quality gates)
```

---

## How to add a new page

1. **Create the route file** in `app/routes/`, e.g. `app/routes/accounts.tsx`:

   ```tsx
   import { useTranslation } from "react-i18next";

   export default function Accounts() {
     const { t } = useTranslation();
     return (
       <div className="container py-6">
         <h1 className="text-xl font-semibold">{t("nav.accounts")}</h1>
       </div>
     );
   }
   ```

2. **Register it** in `app/routes.ts`, inside the existing `layout(...)`
   array (this is what wraps it in `/:lang` + the `AppShell`/`LangLayout`
   machinery):

   ```ts
   layout("routes/lang-layout.tsx", [
     route(":lang", "routes/dashboard.tsx"),
     route(":lang/accounts", "routes/accounts.tsx"), // new
   ]),
   ```

3. **Add any new translation keys** to **both**
   `app/i18n/locales/en/common.json` and `.../ar/common.json` in the same
   PR — CI (`pr-quality-gates.yml`) will fail the build if the keys don't
   match between the two files.

4. Visit `/en/accounts` or `/ar/accounts` to confirm it renders and RTL
   looks right for the Arabic version.

### If the page needs server data

Don't fetch inside `useEffect` — use TanStack Query. Convention:
create `app/routes/accounts/api.ts` (or a flat `app/routes/accounts.api.ts`
if the feature is small) with your query hooks:

```ts
import { useQuery } from "@tanstack/react-query";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/accounts`);
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });
}
```

The shared `queryClient` (in `app/lib/query-client.ts`) is already wired
into `app/root.tsx` via `QueryClientProvider` — nothing extra needed to use
`useQuery`/`useMutation` anywhere in the app.

### If the page needs a form

Use React Hook Form + Zod, same pattern as `app/schemas/example.schema.ts`:

```ts
// app/routes/accounts/schema.ts
import { z } from "zod";

export const newAccountSchema = z.object({
  accountName: z.string().min(2),
  initialDeposit: z.coerce.number().nonnegative(),
});

export type NewAccountValues = z.infer<typeof newAccountSchema>;
```

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newAccountSchema, type NewAccountValues } from "./schema";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<NewAccountValues>({
  resolver: zodResolver(newAccountSchema),
});
```

---

## How to add a new component

- **Shared/reusable across features** → `app/components/<ComponentName>.tsx`
  (create the `app/components/` folder if it doesn't exist yet — it hasn't
  been needed so far, but will be soon).
- **Specific to one feature/page only** → co-locate it next to the route,
  e.g. `app/routes/accounts/AccountCard.tsx`, imported by
  `app/routes/accounts.tsx`.

Style with DaisyUI semantic classes (`card`, `btn`, `badge`, `input`) and
Tailwind utilities. **Never hardcode a hex color** — always go through a
DaisyUI class or a token defined in `app/app.css`. This is enforced
automatically by CI (`pr-quality-gates.yml` scans PR diffs for stray hex
values), but write it right the first time rather than relying on the
check to catch it.

For RTL compatibility, use logical properties: `ms-4`/`me-4` (margin
start/end) and `ps-4`/`pe-4` (padding start/end) instead of
`ml-4`/`mr-4`/`pl-4`/`pr-4` — logical properties flip automatically between
LTR and RTL, physical ones don't.

## Icons

Use `lucide-react` — already the team's chosen icon library. Import
directly, no wrapper component needed:

```tsx
import { Wallet, ArrowUpRight } from "lucide-react";

<Wallet className="text-primary size-5" />;
```

Size via `size-*` Tailwind classes, color via `text-*` classes (so icons
pick up theme tokens automatically) — don't pass raw `width`/`height` or
hardcoded color props.

---

## How to use the stores (Zustand)

Zustand is for **ephemeral, client-only UI state** — things like "is the
sidebar open," "which tab is active," "what step of a multi-step form is
the user on." It is **not** for server data (accounts, transactions,
anything that comes from an API) — that always goes through TanStack
Query instead, never duplicated into a Zustand store.

**Using an existing store** (see `app/store/use-ui-store.ts` for a working
example):

```tsx
import { useUIStore } from "@/store/use-ui-store";

function SidebarToggle() {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  return <button onClick={toggleSidebar}>{isSidebarOpen ? "Close" : "Open"}</button>;
}
```

**Adding a new store:** one small store per concern, not one giant store
for the whole app. Create `app/store/use-<concern>-store.ts`:

```ts
import { create } from "zustand";

interface WizardState {
  step: number;
  next: () => void;
  back: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  step: 0,
  next: () => set((s) => ({ step: s.step + 1 })),
  back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  reset: () => set({ step: 0 }),
}));
```

No provider needed — Zustand stores work as plain hooks, importable
anywhere.

---

## i18n / translations

- Every user-facing string goes through `useTranslation()`'s `t()`
  function — no hardcoded English (or Arabic) strings directly in JSX.
- Add new keys to **both** `en/common.json` and `ar/common.json` in the
  same PR. Run `pnpm check:i18n` locally to verify before pushing — CI
  will catch it either way, but it's faster to catch locally.
- Financial/legal copy needs human review before merge — don't rely on
  a quick manual translation for money-related terms.
- Numerals should always render in Western/English digits even inside
  Arabic text — wrap them with the `.numerals` utility class defined in
  `app/app.css` if you're ever displaying a number inside Arabic-language
  content.

## Styling / DaisyUI theme

Brand colors and design tokens live in `app/app.css`. Key things to know:

- The custom theme is named `nbe-financial-advisor` and is explicitly
  locked as the only theme (`@plugin "daisyui" { themes: ... --default; }`)
  — this was necessary to stop DaisyUI silently falling back to its own
  bundled light/dark themes based on OS preference. Don't remove that lock
  line.
- `btn-primary` is reserved for exactly one high-emphasis action per
  screen — don't reach for it as the default button style everywhere.
- Status indicators use semantic classes (`badge-success`, `badge-error`,
  `badge-warning`) — never brand colors — so status meaning is never
  confused with branding.

---

## Git workflow

- `main` is always deployable. PRs only, no direct pushes (once branch
  protection is enabled by DevOps).
- Branch naming: `feat/<short-desc>`, `fix/<short-desc>`,
  `chore/<short-desc>`.
- Opening a PR auto-populates `.github/PULL_REQUEST_TEMPLATE.md` — fill in
  "How to verify" so your reviewer doesn't have to reverse-engineer how to
  test your change.
- Squash-merge to keep history readable.
- CI runs on every PR: general lint/typecheck/build (DevOps-owned) plus a
  frontend-owned `pr-quality-gates.yml` checking i18n key parity and
  hardcoded hex colors in the diff.

## Known upstream quirks (safe to ignore)

- `The envFile option is deprecated...` and the babel `filter`/`include`
  order notice on `pnpm dev`/`pnpm build` are upstream bugs in
  `@react-router/dev`/`vite-plugin-babel`, not our config. No action
  needed.
- `@react-router/node` and `isbot` are permanent dependencies, not
  removable — both are required by React Router's default `entry.server`
  template, which the build-time prerender step uses since this repo
  doesn't provide a custom entry file. This isn't dead weight to clean up.
- `eslint-plugin-react-hooks` is pinned to `6.1.1`, not latest, due to a
  known upstream crash in 7.x — see `DECISIONS_CHANGELOG.md` row 8.

## Where to look next

- `DECISIONS_CHANGELOG.md` — every place this repo's actual setup diverged
  from the original planning docs, and why.
- `DEVOPS_HANDOFF_PROMPT.md` — infra/CI/Docker specifics, if you need to
  touch anything in `.github/workflows/` or the Docker setup.
