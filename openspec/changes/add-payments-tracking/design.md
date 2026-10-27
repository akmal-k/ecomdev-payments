## Context

This is a greenfield test task for Ecomdev with a 3-day deadline. Reviewers will clone the repo, follow the README and check each listed requirement against the code. So the most important things are: it runs from scratch with minimal setup, every requirement is clearly traceable, and the ambiguous "debtor" rule is stated explicitly rather than hidden.

Users: training center staff, mostly on a phone. Currency is UZS. Amounts are whole sums.

## Goals / Non-Goals

**Goals:**
- One command to install and one to run; no external database or services.
- A clear, documented, tested definition of "debt for a month".
- The web page works well on a ~375px-wide phone screen.

**Non-Goals:**
- Authentication / multi-tenant access (listed as an improvement in README).
- Telegram bot (option A); the service layer is kept UI-agnostic so a bot could be added later.
- Carry-over balances between months, fee history, partial-month proration (documented as limitations).
- Editing or deleting payments (not required by the task).

## Decisions

### Stack: Node.js + TypeScript + Fastify
Fastify gives schema-friendly routing, a built-in injector for tests (`app.inject`) and static file serving via `@fastify/static`. Alternatives: Express (more familiar but needs extra libs for the same) and NestJS (too heavy for this size).

### Storage: SQLite via `better-sqlite3`
It needs no install, is a single file and is synchronous, which keeps code simple. Alternative: PostgreSQL in Docker, which is more "production" but adds a setup step for reviewers. The repository layer is isolated, so swapping later is cheap. Schema is created on startup with `CREATE TABLE IF NOT EXISTS` (no migration tool for two tables).

```
students                         payments
─────────────────────────        ──────────────────────────
id           INTEGER PK          id          INTEGER PK
name         TEXT NOT NULL       student_id  INTEGER FK → students.id
phone        TEXT NOT NULL       amount      INTEGER NOT NULL  (> 0)
group_name   TEXT NOT NULL       paid_on     TEXT  'YYYY-MM-DD'
monthly_fee  INTEGER NOT NULL    created_at  TEXT
created_at   TEXT 'YYYY-MM-DD'
deleted_at   TEXT NULL
```
Index on `payments(student_id, paid_on)`.

### Money as integers
All amounts are integer UZS sums. This avoids float rounding. Validation rejects non-integers.

### Validation: zod
Request bodies and query strings are parsed with zod schemas. Errors are returned as `400 { error, details }`.

### Debt rule (the core decision)
For month `M` (`YYYY-MM`) and each non-deleted student whose `created_at` is on or before the last day of `M`:
```
paid(M) = Σ payments.amount where paid_on in [M-01, last day of M]
debt(M) = monthly_fee − paid(M)
debtor  ⇔ debt(M) > 0
```
This is computed in a single SQL query (LEFT JOIN + GROUP BY + HAVING). Results are sorted by debt descending, then name.
- Alternatives considered: a running balance where overpayment carries over. It is fairer but needs opening balances and a fee history, so it is out of scope and listed as an improvement.
- Students created during month M owe the full fee for M (no proration). This is documented.
- The current `monthly_fee` is used for all months (no fee history). This is documented.

### Delete = soft delete
`DELETE /students/:id` sets `deleted_at`. Deleted students disappear from lists, the debtors report and payment endpoints (404), but their payment history is kept. Alternatives: hard delete with cascade (loses financial history) or blocking the delete when payments exist (awkward UX).

### "Current month" and dates
The server uses `TZ` (default `Asia/Tashkent`, set in the npm scripts) to compute today/current month. `GET /debtors` without `month` defaults to the current month. A payment's `date` defaults to today.

### API shape
```
POST   /students                    → 201 Student
GET    /students?group=             → 200 Student[]
GET    /students/:id                → 200 Student | 404
PATCH  /students/:id                → 200 Student | 404
DELETE /students/:id                → 204 | 404
POST   /students/:id/payments       → 201 Payment | 404
GET    /students/:id/payments       → 200 Payment[] (newest first) | 404
GET    /debtors?month=YYYY-MM       → 200 { month, total, debtors: [{ student…, monthlyFee, paid, debt }] }
GET    /                            → web page
```
JSON uses camelCase (`monthlyFee`, `group`, `date`).

### Code layout
```
src/
  db.ts            open DB + schema
  students.ts      repo + routes
  payments.ts      repo + routes
  debtors.ts       query + route
  app.ts           buildApp(dbPath) – used by server and tests
  server.ts        listen
public/index.html  page (vanilla JS + CSS, no build step)
test/*.test.ts     vitest, in-memory DB via app.inject
```

### Web page: static HTML + vanilla JS
There is no frontend build. One page with a month picker and a debtor list (cards). Tapping a debtor pre-fills the payment form. The form has a student select, amount (numeric keypad) and date. After submit the list refreshes. Alternatives: React/Vite, which is overkill and adds a build step.

## Risks / Trade-offs

- [Reviewer expects overpayment to carry over] → Rule stated in README and the API section; carry-over listed as the top "next week" improvement.
- [`better-sqlite3` is a native module; install can fail on unusual Node versions] → Pin Node ≥ 20 in `engines`, provide a Dockerfile as fallback.
- [No auth: anyone with the URL can add payments] → Out of scope for a test task; listed in improvements.
- [Timezone off-by-one around midnight] → Explicit `TZ=Asia/Tashkent`; dates stored as plain `YYYY-MM-DD` strings.

## Open Questions

- Should the debtors report also show students with zero payments in a month before they had any payments at all? (Current answer: yes, if `created_at` ≤ end of month.)
- Should the seed script be part of `npm run dev`? (Current answer: separate `npm run seed`.)
