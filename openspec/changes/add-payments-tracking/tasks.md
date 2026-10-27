## 1. Project setup

- [x] 1.1 Create `package.json` (Node ≥ 20, `type: module`) with scripts `dev`, `start`, `build`, `test`, `seed`, all running with `TZ=Asia/Tashkent`
- [x] 1.2 Add dependencies `fastify`, `@fastify/static`, `better-sqlite3`, `zod` and dev dependencies `typescript`, `tsx`, `vitest`, `@types/node`, `@types/better-sqlite3`
- [x] 1.3 Add `tsconfig.json`, `.gitignore` (node_modules, dist, data/*.db), `.env.example` (`PORT`, `DB_PATH`)

## 2. Database

- [x] 2.1 Implement `src/db.ts`: open SQLite at `DB_PATH` (or `:memory:`), enable foreign keys, create `students` and `payments` tables and the `payments(student_id, paid_on)` index
- [x] 2.2 Add date helpers: today and current month in the server TZ, validate `YYYY-MM-DD` / `YYYY-MM`, last day of month

## 3. Students API

- [x] 3.1 zod schemas for create (all fields required) and update (partial, at least one field)
- [x] 3.2 Repository: create, list (optional group filter, non-deleted, ordered by name), get, update, soft delete
- [x] 3.3 Routes `POST/GET /students`, `GET/PATCH/DELETE /students/:id` with 400/404 handling and camelCase JSON

## 4. Payments API

- [x] 4.1 zod schema: positive integer `amount`, optional valid `date` defaulting to today
- [x] 4.2 Routes `POST /students/:id/payments` (201/400/404) and `GET /students/:id/payments` (newest first, 404 for unknown/deleted)

## 5. Debtors report

- [x] 5.1 Single SQL query: non-deleted students with `created_at` ≤ end of month, LEFT JOIN payments in month, `HAVING monthly_fee - paid > 0`, sorted by debt desc then name
- [x] 5.2 Route `GET /debtors?month=` with default to current month, 400 on invalid month, response `{ month, total, debtors }`

## 6. App wiring

- [x] 6.1 `src/app.ts` `buildApp({ dbPath })`: register routes, static `public/`, a common zod error → 400 handler
- [x] 6.2 `src/server.ts`: read `PORT`/`DB_PATH`, create `data/` dir if needed, listen
- [x] 6.3 `scripts/seed.ts`: a few groups and students, with mixed paid/partial/unpaid payments for the current month

## 7. Web page

- [x] 7.1 `public/index.html`: mobile-first layout, month picker, debtors list as cards, total, "no debtors" state
- [x] 7.2 Payment form: student select (from `GET /students`), amount with `inputmode="numeric"`, date defaulting to today, success/error messages
- [x] 7.3 Tap a debtor to pre-fill the form with that student and their remaining debt; refresh the list after a successful payment
- [x] 7.4 Check the layout at 375px width (no horizontal scroll)

## 8. Tests

- [x] 8.1 Debtors tests covering every scenario in `specs/debtors-report` (partial, none, full/overpaid, other month, created after month, deleted, default month, invalid month)
- [x] 8.2 Students API tests: create, validation 400, list + group filter, patch, delete → 404 and hidden
- [x] 8.3 Payments API tests: add with/without date, invalid amount/date, unknown student, list order

## 9. Delivery

- [x] 9.1 `Dockerfile` (fallback in case of native-module install problems)
- [x] 9.2 README (Russian): requirements, run from scratch (`git clone`, `npm install`, `npm run seed`, `npm run dev`), API reference with curl examples, the debt rule and its limitations, 3–5 "next week" improvements
- [x] 9.3 README checklist that maps each item of task parts 1–3 to code/README sections; note anything not done
- [ ] 9.4 Push to a public GitHub repo
