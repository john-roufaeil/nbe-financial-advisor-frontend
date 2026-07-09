# Frontend API Requirements

Maps every page in the frontend (React Router SPA, `app/routes/*`) to the backend endpoints it needs, against the existing **API Endpoints** document. Existing endpoints are referenced as-is; endpoints with no suitable match are proposed as **NEW**.

All demo/local data currently lives in `app/lib/demo-*.ts` fixtures and plain zustand stores (`app/store/*.ts`), none of it persisted server-side. This doc describes what should replace that.

---

# Splash (`/:lang`)

No user data displayed — logo, tagline, "Get Started" / "Continue where you left off" / "Login" buttons, language switcher.

## Required Endpoints

### GET /users/me _(existing)_

Purpose:

- Validate that a stored auth token is still good, so "Continue where you left off" / auto-redirect to `/dashboard` only fires for a genuinely authenticated session (today this is a local `isAuthenticated` boolean in `localStorage` with no server check at all).

Frontend needs:

- Whether the call succeeds (200) or fails (401) — body unused here.

Called:

- App boot / splash mount, only if a token is present in storage.

Notes:

- Today there is **no server round-trip at all** on this page. This is a proposed _addition_ to close a real gap (a revoked/expired token currently still "logs in" the user locally).

---

# Consent (`/:lang/consent`)

## Required Endpoints

### POST /users/me/consent _(existing)_

Purpose:

- Record consent acceptance (timestamp + version) before onboarding starts.

Called:

- On "Continue" click, after the checkbox is checked, before navigating to `/onboarding`.

Request body:

```ts
{
  consentVersion: string;
} // e.g. "2026-01-terms-v1"
```

Response:

```ts
{
  consentId: string;
  acceptedAt: string;
}
```

Notes:

- Today consent acceptance is **not recorded anywhere** — the checkbox only gates a local `agreed` boolean. This is a real gap for compliance/audit (Functional Req. references data deletion, so consent logging should exist symmetrically).
- Assumption: a `consentVersion` string constant is baked into the frontend build and sent as-is; backend just stores it.

---

# Onboarding (`/:lang/onboarding`)

4-step wizard (personal info → employment → financial goals → risk tolerance). Currently the entire collected `OnboardingData` object is **discarded** on "Finish" — never sent anywhere. This is the biggest gap on this page.

## Required Endpoints

### POST /auth/signup _(existing)_

Purpose:

- Create the account. Must happen before any `PATCH /users/me*` calls (all user routes are auth-scoped).

Called:

- On step 1 "Continue", or on final "Finish" — see **Question 1** below, since onboarding currently collects no password.

Request body (assumption — see Questions):

```ts
{
  email: string;
  password: string;
  fullName: string;
}
```

Response:

```ts
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  }
}
```

### PATCH /users/me _(existing)_

Purpose:

- Persist step 1 fields (name/email/phone) as profile data.

Called:

- On leaving step 1 ("Continue"), or batched at the end — see combinability note below.

Request body:

```ts
{
  fullName: string;
  email: string;
  phone: string;
}
```

### PATCH /users/me/preferences _(existing)_

Purpose:

- Persist step 2 (employment status, monthly income) and step 4 (risk tolerance) as user financial preferences.

Called:

- On leaving step 2 and step 4 respectively, or batched at the end.

Request body:

```ts
{
  employmentStatus?: "employed" | "selfEmployed" | "student" | "unemployed" | "retired";
  monthlyIncome?: number;
  riskTolerance?: "conservative" | "moderate" | "aggressive";
}
```

### GET /budget/starter-templates _(existing)_

Purpose:

- Show 3–5 starter budget templates during step 3 (financial goals) so the selected goals can be paired with a suggested allocation — **the endpoint already exists for exactly this ("3–5 onboarding-step starter templates") but the frontend's step 3 doesn't call it today**; it's just a plain multi-select with no template preview.

Called:

- On step 3 mount.

Response:

```ts
{
  templates: {
    id: string;
    name: string;
    suggested: boolean;
    allocations: {
      category: string;
      pct: number;
    }
    [];
  }
  [];
}
```

### POST /budget _(existing)_

Purpose:

- Create the initial budget plan from the selected goals + (optionally) chosen starter template, finalizing onboarding.

Called:

- On "Finish" (step 4 submit).

Request body:

```ts
{
  goals: string[];              // e.g. ["emergencyFund", "buyHome"]
  riskTolerance: string;
  templateId?: string;          // if one of the starter templates was picked
}
```

Response:

```ts
{
  budgetId: string;
}
```

## Combining calls

Steps 1/2/4 field updates (`PATCH /users/me`, `PATCH /users/me/preferences`) can be deferred and sent as **one combined submit** on "Finish", alongside `POST /budget`, instead of one call per step — reduces 3 round trips to 1–2 and avoids partial-profile states if the user abandons the wizard midway. Current per-step store updates are local-only (zustand + localStorage persist), so batching costs nothing UX-wise.

---

# Sign In (`/:lang/sign-in`)

## Required Endpoints

### POST /auth/login _(existing)_

Purpose:

- Authenticate with email/password.

Called:

- Form submit (after zod validation passes).

Request body:

```ts
{
  email: string;
  password: string;
}
```

Response:

```ts
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
  }
}
```

Notes:

- Today this page performs **no real authentication** — any zod-valid input (email format + 6-char password) logs the user in locally. This is the single biggest auth gap.

---

# Dashboard (`/:lang/dashboard`)

## Required Endpoints

### GET /dashboard _(existing)_

Purpose:

- Load the aggregate dashboard: stats grid (balance/income/spending/savings-rate + deltas), budget category breakdown (spent vs. budget per category).

Frontend needs:

```ts
{
  currency: string; // "EGP"
  stats: {
    key: "balance" | "income" | "spending" | "savingsRate";
    value: number;
    deltaPct: number;
    goodDirection: "up" | "down";
  }
  [];
  budget: {
    categories: {
      name: string;
      budget: number;
      spent: number;
    }
    [];
  }
}
```

Called:

- Dashboard mount, and after returning to the tab from adding/editing a transaction or approving a document (currently the demo data is static and never reflects new transactions at all — real integration must re-fetch or invalidate this on any transaction/document mutation elsewhere in the app).

### GET/POST/PATCH/DELETE /goals — **NEW** (see Question 2)

Purpose:

- Full CRUD for the _multiple, independent_ savings goals shown in `GoalsCard`/`GoalsEditModal` (e.g. "Emergency Fund", "New Car", "Vacation" simultaneously).

Frontend needs per goal:

```ts
{
  id: string;
  name: string;
  current: number;
  target: number;
}
```

Called:

- `GET /goals` — dashboard mount (can be folded into `GET /dashboard`, see below).
- `POST /goals` — "Add" form submit in `GoalsEditModal`.
- `PATCH /goals/{goal_id}` — inline field edit (name/current/target), fired per change.
- `DELETE /goals/{goal_id}` — delete button, after confirm dialog.

Notes:

- **This is a real inconsistency**, not just a missing route — the existing API models exactly **one** goal, embedded on the single active budget plan (`PATCH /budget` goal fields, `PATCH /dashboard/goal` alias, `GET /budget/savings-progress`). The frontend UI supports an arbitrary list of independent goals. One of these has to give — see **Question 2**.

## Combining calls

`GET /dashboard` could embed `goals: FinancialGoal[]` directly (as `budget` is already embedded) instead of a separate `GET /goals` call, saving a round trip on every dashboard load — recommended if the multi-goal model is adopted.

---

# Chat (`/:lang/chat`)

Chat is mocked end-to-end today: no LLM call, a 600ms `setTimeout`, and a keyword-matched fake tool result. Below is the real mapping.

## Required Endpoints

### GET /chat/conversations _(existing)_

Purpose:

- Populate the sidebar thread list.

Called:

- App-shell mount (`AppLayout` renders the thread list on any page, not just `/chat`) — see cross-page note.

Response:

```ts
{
  conversations: {
    id: string;
    title: string;
    updatedAt: string;
  }
  [];
}
```

### POST /chat/conversations _(existing)_

Purpose:

- Create a new thread ("New chat" button).

Called:

- "New chat" click.

Response:

```ts
{
  id: string;
  title: string;
}
```

### GET /chat/conversations/{conversation_id}/messages _(existing)_

Purpose:

- Load a thread's message history on switch.

Called:

- Switching threads in the sidebar, or on initial chat page load for the current thread.

Response:

```ts
{
  messages: {
    id: string;
    role: "user" | "assistant";
    text: string;
    createdAt: string;
    toolCall?: { toolName: string; args: Record<string, unknown>; result: unknown };
    attachments?: { id: string; type: "image" | "document"; name: string; url: string }[];
  }[]
}
```

### POST /chat/conversations/{conversation_id}/messages _(existing, streamed)_

Purpose:

- Send a user message and stream back the assistant's reply (including any structured tool-call result, e.g. spending breakdown, that the frontend renders via `SpendingBreakdownTool`).

Called:

- Composer submit, or a suggestion chip click (pre-filled prompt text).

Request body:

```ts
{ text: string; attachmentIds?: string[] }
```

Response (stream, final assembled shape):

```ts
{
  id: string;
  text: string;
  toolCall?: {
    toolName: "showSpendingBreakdown";
    result: { currency: string; month: string; total: number; categories: { name: string; amount: number; pct: number }[] };
  };
}
```

### POST /chat/conversations/{conversation_id}/attachments _(existing)_

Purpose:

- Upload an image/document attached to the composer (reuses the Statements pipeline per the API doc).

Called:

- File attached in composer, before the message is sent.

Request: multipart file upload.

Response:

```ts
{
  id: string;
  type: "image" | "document";
  name: string;
  url: string;
}
```

### DELETE /chat/conversations/{conversation_id} _(existing)_

Purpose:

- Delete a thread (trash icon in sidebar).

Called:

- Thread delete click.

### PATCH /chat/conversations/{conversation_id} — **NEW**

Purpose:

- Rename a thread. The frontend already auto-titles threads from the first ~40 chars of the user's first message; there's no existing route to persist a title change.

Request body:

```ts
{
  title: string;
}
```

### POST /feedback _(existing, reused)_

Purpose:

- Submit thumbs-up/down feedback on an assistant message (currently a no-op in the UI).

Called:

- Feedback button click on an assistant message.

Request body (assumption, shape not defined in the source doc):

```ts
{
  type: "chat_message";
  targetId: string;
  sentiment: "positive" | "negative";
}
```

Notes:

- Reusing the generic `/feedback` endpoint avoids a bespoke chat-feedback route, but its request shape isn't specified anywhere — see **Question 3**.

## Combining calls

`GET /chat/conversations` (sidebar list) and `GET .../messages` (current thread) could be combined into one call on initial chat-page load (`GET /chat/conversations?include=currentMessages` or similar) to avoid a waterfall, since both are needed immediately.

---

# Transactions (`/:lang/transactions`)

## Required Endpoints

### GET /transactions _(existing)_

Purpose:

- Load the filterable/searchable/paginated transaction list.

Frontend needs:

```ts
{
  items: {
    id: string;
    datetime: string;
    title: string;
    category: string;
    type: "income" | "expense";
    amount: number;
  }
  [];
  total: number;
}
```

Query parameters:

- Existing: `account_id`, `category`, `from`, `to`, offset pagination (`offset`/`limit` or `page`/`page_size`).
- **Missing today**: `type` (income/expense filter) and a free-text `q`/`search` param (matches title or category) — the frontend's search box and income/expense toggle have no corresponding backend filter in the documented route. Propose adding both as query params on the existing route rather than a new endpoint.

Called:

- Page load, and on every filter/search/pagination change (currently all client-side over an in-memory demo array — should move to server-side filtering once real data volume exists).

### POST /transactions _(existing)_

Purpose:

- Manual transaction entry (Add Transaction modal).

Request body:

```ts
{
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
}
```

Called:

- Add Transaction modal submit.

Notes:

- Per the API doc this is "subject to duplicate check" — frontend should surface a duplicate-detected response distinctly (currently no such state exists in `AddTransactionModal`); see **Question 4**.

### PATCH /transactions/{transaction_id} _(existing)_

Purpose:

- Edit a transaction (edit modal, pre-filled).

Called:

- Edit modal submit.

Request body: same shape as POST, partial.

### DELETE /transactions/{transaction_id} _(existing)_

Purpose:

- Delete a transaction.

Called:

- Trash icon → confirm dialog → confirmed.

---

# Documents / Bank Statements (`/:lang/documents`)

Maps to the **Statements** domain. This page currently simulates the entire OCR/review/approve pipeline client-side (fake async status, random bank assignment, random extracted transactions) — this is the single biggest integration effort in the app.

## Required Endpoints

### GET /statements _(existing)_

Purpose:

- Load the filterable/searchable/paginated statement list.

Frontend needs:

```ts
{
  items: {
    id: string; name: string; type: "pdf" | "image" | "doc"; uploadDate: string; sizeKb: number;
    status: "uploading" | "processing" | "failed" | "processed";
    bankCode?: string;      // e.g. "NBE" — frontend maps to full name + logo locally
    approved: boolean;
  }[];
  total: number;
}
```

Query parameters: same gap as transactions — needs `type` and `q` added (frontend filters by doc type and free-text name search).

Called:

- Page load, filter/search/pagination changes.

### POST /statements _(existing, multipart)_

Purpose:

- Upload one or more bank statement files; queues the OCR/normalization pipeline.

Called:

- Add Bank Statement modal, on "Upload" (per staged file — or one multipart request with multiple files, see combinability note).

Request: multipart file(s).

Response:

```ts
{
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  sizeKb: number;
  status: "uploading";
}
```

### GET /statements/{statement_id} _(existing)_

Purpose:

- Poll a single statement's status (uploading → processing → processed/failed) while its detail modal is open.

Called:

- Detail modal open, and polled (e.g. every 1–2s) while `status` is `uploading`/`processing`. **A websocket/SSE push would remove the need for polling** — see Question 5.

Response: same shape as the list item above.

### GET /statements/{statement_id}/ocr-result _(existing)_

### GET /statements/{statement_id}/normalized _(existing)_

Purpose:

- `ocr-result` = raw OCR text/fields; `normalized` = the structured, editable extracted transactions the frontend actually renders for review (`ExtractedTransaction[]` — title/category/type/amount/datetime). The Documents page only needs `normalized`; `ocr-result` is not currently surfaced in any UI (available for a future "view raw OCR" affordance).

Called:

- Detail modal, once `status === "processed"`.

Response (`normalized`):

```ts
{
  bankCode?: string;
  transactions: { id: string; datetime: string; title: string; category: string; type: "income" | "expense"; amount: number }[];
}
```

### PATCH /statements/{statement_id}/normalized/{transaction_id} — **NEW**

Purpose:

- Edit one extracted transaction's fields before approval (inline-editable in the review UI).

Request body:

```ts
{ title?: string; category?: string; type?: "income" | "expense"; amount?: number }
```

Called:

- Every field edit while reviewing an unapproved, processed statement.

### POST /statements/{statement_id}/approve — **NEW**

Purpose:

- Commit the (possibly edited) normalized transactions as real `Transaction` records and mark the statement approved. No existing route performs this — it's the core "review and approve" action the whole Documents page is built around.

Called:

- "Approve & add to transactions" button.

Response:

```ts
{ approvedAt: string; createdTransactionIds: string[] }
```

### POST /statements/{statement_id}/retry — **NEW**

Purpose:

- Re-queue OCR/normalization after a `failed` status. No existing route restarts processing on a statement.

Called:

- "Retry" button in the failed-state detail modal.

Response: same shape as `GET /statements/{statement_id}` with `status: "uploading"`.

### DELETE /statements/{statement_id} _(existing)_

Purpose:

- Delete a statement.

Called:

- Trash icon → confirm dialog → confirmed.

## Combining calls

- If multiple files are staged in the upload modal, a single `POST /statements` accepting multiple files in one multipart request (returning an array) would save N round trips vs. one call per file.
- `GET /statements/{id}` + `GET /statements/{id}/normalized` could be combined into one response once `status === "processed"` (normalized data embedded directly in the statement object) to avoid a second call every time the detail modal opens for an already-processed statement.

---

# Profile (`/:lang/profile`)

Four editable sections (profile, contact, address, financial) plus sign-out. Entirely local/in-memory today (hardcoded demo person, no persistence), and **never synced with onboarding data** despite overlapping fields (employmentStatus, monthlyIncome, riskTolerance).

## Required Endpoints

### GET /users/me _(existing)_

### GET /users/me/preferences _(existing)_

Purpose:

- Load all four sections on page mount.

Frontend needs (assumption on field grouping — see Question 6):

```ts
// GET /users/me
{
  fullName: string;
  dob: string;
  nationalId: string;
  email: string;
  phone: string;
  address: {
    country: string;
    city: string;
    addressLine: string;
  }
}
// GET /users/me/preferences
{
  employmentStatus: string;
  monthlyIncome: number;
  riskTolerance: string;
}
```

Called:

- Profile page mount (can share a cache with the sidebar's `GET /users/me` call — see cross-page note).

### PATCH /users/me _(existing)_

Purpose:

- Save edits to the profile/contact/address sections.

Called:

- Per-section "save" (checkmark) click.

Request body: the relevant section's fields only (partial update).

### PATCH /users/me/preferences _(existing)_

Purpose:

- Save edits to the financial section (employment status, monthly income, risk tolerance).

Called:

- Financial section "save" click.

### POST /auth/logout _(existing)_

Purpose:

- Sign out.

Called:

- "Sign Out" button.

## Combining calls

`GET /users/me` and `GET /users/me/preferences` are both needed immediately on mount — combining into one `GET /users/me?include=preferences` (or always embedding preferences in `/users/me`) would save a round trip. This page and the sidebar avatar/name both need `GET /users/me`; a shared client-side cache (e.g. one query key) avoids fetching it twice per navigation.

---

# App Shell / Sidebar (`AppLayout`, all authenticated pages)

Persistent across every page under `app-layout.tsx` — not a route itself, but has its own data needs called once and reused.

## Required Endpoints

### GET /users/me _(existing)_

Purpose:

- Avatar initial + name shown in the sidebar's account chip / "View profile" row.

Called:

- App-shell mount, cached/shared with the Profile page (see above).

### GET /chat/conversations _(existing)_

Purpose:

- Thread list rendered in the sidebar (only visually shown while on `/chat`, but the underlying chat runtime/provider wraps the _entire_ app today, so this is effectively loaded app-wide).

Called:

- App-shell mount.

Notes:

- Worth reconsidering whether the chat runtime/provider needs to wrap every route, or only the `/chat` subtree — currently `AssistantRuntimeProvider` wraps all of `AppLayout`, which may cause `GET /chat/conversations` to fire on first render of _any_ authenticated page, not just chat.

---

# Language Switcher

No backend calls. Confirmed purely client-side: updates `document.dir`/`lang`, `localStorage`, and re-navigates under the new `/:lang` prefix. No user-level locale preference is persisted server-side — flagged only as a possible future nice-to-have (e.g. `PATCH /users/me/preferences { locale }`), not a current requirement.

---

# Backend Domains With No Current Frontend Consumer

Noted for completeness — these exist in the API doc but nothing in the frontend calls them today:

- **Bank Accounts** (`/accounts`) — there is no account-linking UI; statements are uploaded standalone with no `account_id`. If statements should belong to an account, the frontend needs an accounts-management page (or at minimum an account picker in the upload modal) that doesn't exist yet — see Question 7.
- **Analytics** (`/analytics/*`) — monthly summaries, recurring charges, anomalies, spending insights, net worth, stability score have no dedicated frontend page. The closest analog is the chat's `SpendingBreakdownTool`, but that data is currently randomly generated client-side rather than calling `GET /analytics/category-breakdown`.
- **Recommendations** (`/recommendations`) — no UI surface at all currently.
- **Feedback & Support** (`/issues`) — no bug-report/support UI; only the (currently no-op) chat message feedback buttons exist, proposed above to reuse `POST /feedback`.

---

# Questions for the Frontend/Backend Team

1. **Signup timing & missing password field.** Onboarding step 1 collects `fullName`/`email`/`phone` but never a password, yet `POST /auth/signup` presumably requires one. Does account creation happen _before_ onboarding (e.g., a password field needs to be added to step 1, or a separate signup screen precedes it), or is passwordless/magic-link signup intended? The current flow just flips a local `isAuthenticated` flag on "Finish" with no account ever created.

2. **Single goal vs. multiple goals.** The existing `budget` domain models exactly one goal per active budget plan (`PATCH /budget` goal fields, `PATCH /dashboard/goal`), but the dashboard UI supports an arbitrary list of independent named goals (Emergency Fund, New Car, Vacation, ...) with full CRUD. Which is the intended product behavior — should the frontend be simplified to one goal, or does the backend need a new `/goals` list resource decoupled from the single budget plan?

3. **Chat message feedback shape.** Proposed reusing `POST /feedback` for thumbs-up/down on assistant messages, but that endpoint's request/response shape isn't defined in the source doc. Should it accept a polymorphic `{ type, targetId, sentiment }`, or should chat feedback get its own endpoint under the AI Assistant domain instead?

4. **Duplicate transaction handling.** `POST /transactions` is documented as "subject to duplicate check" — what does the frontend receive when a duplicate is detected (409 with details? 200 with a `duplicate: true` flag?), and what should the Add Transaction modal show the user in that case? Currently there's no such state in the UI at all.

5. **Statement processing: polling vs. push.** With no websocket/SSE route documented for statement status, the frontend would need to poll `GET /statements/{id}` while `uploading`/`processing`. Is a push mechanism (SSE, matching the chat streaming pattern) planned, or is polling the intended approach?

6. **Field ownership between `/users/me` and `/users/me/preferences`.** This doc assumes profile+contact+address live under `/users/me` and employment/income/risk-tolerance live under `/users/me/preferences`, purely by naming convention — neither shape is defined in the source doc. Please confirm the actual field grouping so the Profile page and onboarding submit hit the right routes.

7. **Should statements link to an Account?** The `Bank Accounts` domain exists but nothing in the frontend creates or selects one, and `DocumentRecord` has no `account_id`. Is standalone statement upload (bank identified purely from OCR, as today) the intended permanent behavior, or should uploads eventually require selecting/creating an `Account` first?

8. **Onboarding ↔ Profile data duplication.** `employmentStatus`, `monthlyIncome`, and `riskTolerance` are collected once in onboarding and then re-editable independently on the Profile page. Confirming both write to the same `PATCH /users/me/preferences` resource (this doc assumes so) would resolve the frontend's current bug where these two stores don't sync at all.

9. **Rename-conversation route.** No existing route persists a chat thread title change; proposed `PATCH /chat/conversations/{conversation_id}` as a new addition — confirm this is acceptable or if titles are meant to be server-derived only (e.g., auto-generated from the first message, non-editable).
