## ADDED Requirements

### Requirement: Add payment
The system SHALL record a payment via `POST /students/:id/payments` with a positive integer `amount` and an optional `date` (`YYYY-MM-DD`, defaults to today in the server timezone), returning `201` with the stored payment.

#### Scenario: Payment with explicit date
- **WHEN** a client posts `{ "amount": 300000, "date": "2026-10-05" }` for an existing student
- **THEN** the system responds `201` with `{ id, studentId, amount: 300000, date: "2026-10-05" }`

#### Scenario: Payment without date
- **WHEN** a client posts `{ "amount": 300000 }`
- **THEN** the payment is stored with today's date

#### Scenario: Invalid amount or date
- **WHEN** the amount is zero, negative or not an integer, or the date is not a valid `YYYY-MM-DD` calendar date
- **THEN** the system responds `400` and nothing is stored

#### Scenario: Unknown student
- **WHEN** a client posts a payment for a student id that does not exist or was deleted
- **THEN** the system responds `404`

### Requirement: List payments by student
The system SHALL return a student's payments via `GET /students/:id/payments`, newest date first.

#### Scenario: Student with payments
- **WHEN** a client requests payments for a student who has two payments
- **THEN** the system responds `200` with both payments ordered by date descending

#### Scenario: Unknown student
- **WHEN** a client requests payments for a student id that does not exist or was deleted
- **THEN** the system responds `404`
