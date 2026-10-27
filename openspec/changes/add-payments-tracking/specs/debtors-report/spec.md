## ADDED Requirements

### Requirement: Debtors for a month
The system SHALL return via `GET /debtors?month=YYYY-MM` every non-deleted student who existed by the end of that month (`createdAt` ≤ last day of the month) and whose payments dated within that calendar month total less than their current `monthlyFee`. Each entry SHALL include the student's `id`, `name`, `phone`, `group`, `monthlyFee`, `paid` and `debt = monthlyFee − paid`. The response SHALL be `{ month, total, debtors }`, where `total` is the sum of debts, and debtors are sorted by `debt` descending, then by name.

#### Scenario: Partial payment
- **WHEN** a student with `monthlyFee` 500000 paid 200000 on 2026-10-03 and the client requests `month=2026-10`
- **THEN** the student is listed with `paid: 200000` and `debt: 300000`

#### Scenario: No payments
- **WHEN** a student created before October has no payments dated in 2026-10
- **THEN** the student is listed with `paid: 0` and `debt` equal to the monthly fee

#### Scenario: Paid in full or overpaid
- **WHEN** a student's October payments total exactly the monthly fee or more
- **THEN** the student is not listed for `2026-10`

#### Scenario: Payments in other months are ignored
- **WHEN** a student paid the full fee on 2026-09-30 and nothing in October
- **THEN** the student is listed for `2026-10` with `paid: 0`

#### Scenario: Student created after the month
- **WHEN** a student was created on 2026-11-02 and the client requests `month=2026-10`
- **THEN** the student is not listed

#### Scenario: Deleted student
- **WHEN** a student has been deleted
- **THEN** the student is not listed for any month

### Requirement: Month parameter handling
The system SHALL default `month` to the current month in the server timezone when it is omitted, and SHALL reject values that are not a valid `YYYY-MM` month.

#### Scenario: Month omitted
- **WHEN** a client requests `GET /debtors` without `month`
- **THEN** the report is computed for the current month and `month` in the response shows it

#### Scenario: Invalid month
- **WHEN** a client requests `GET /debtors?month=2026-13` or `month=oct`
- **THEN** the system responds `400` with an error message
