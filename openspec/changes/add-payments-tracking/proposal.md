## Why

A small training center needs to know who has not paid in full for a given month and how much they owe. Right now this lives in someone's head or a spreadsheet. This change builds a minimal payment tracker: a REST API, a SQLite store and a mobile-friendly web page. It is the Ecomdev developer test task (parts 1–3).

## What Changes

- New Node.js + TypeScript service with a REST API backed by SQLite (no external DB to install).
- Students CRUD: name, phone, group, monthly fee.
- Payments: add a payment (student, amount, date) and list payments per student.
- `GET /debtors?month=YYYY-MM`: students whose payments in that month total less than their monthly fee, with the amount owed.
- Mobile-first web page (option B): debtors for a selected month plus a form to add a payment.
- README in Russian: how to run from scratch, and 3–5 improvements for an extra week.
- Automated tests for the debtors calculation and the main API flows.

## Capabilities

### New Capabilities
- `students`: create, list, get, update and delete students (name, phone, group, monthly fee); validation rules.
- `payments`: record a payment for a student and list a student's payments.
- `debtors-report`: compute, for a calendar month, which students paid less than their monthly fee and how much each owes.
- `payments-web-ui`: a mobile-friendly page that shows the month's debtors and lets staff add a payment.

### Modified Capabilities
<!-- None: this is a new project with no existing specs. -->

## Impact

- New repository `ecomdev-payments` (Node.js ≥ 20, TypeScript).
- Dependencies: `fastify`, `@fastify/static`, `better-sqlite3`, `zod`; dev: `typescript`, `tsx`, `vitest`.
- Creates a local SQLite file (`data/app.db` by default, configurable via env).
- HTTP API on port 3000 by default; the web page is served from the same process.
