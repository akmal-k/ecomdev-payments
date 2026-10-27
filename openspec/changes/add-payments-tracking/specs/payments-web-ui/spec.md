## ADDED Requirements

### Requirement: Debtors page
The system SHALL serve a web page at `/` that shows the debtors for a selected month (defaulting to the current month), with each debtor's name, group, phone, paid amount and debt, and the total debt.

#### Scenario: Open the page
- **WHEN** a user opens `/` on a phone
- **THEN** the current month's debtors are shown as a readable list without horizontal scrolling at 375px width

#### Scenario: Change month
- **WHEN** the user picks another month
- **THEN** the list reloads with that month's debtors

#### Scenario: No debtors
- **WHEN** the selected month has no debtors
- **THEN** the page shows an explicit "no debtors" message

### Requirement: Add payment form
The page SHALL provide a form to add a payment with a student selector, an amount field (numeric keypad on mobile) and a date field defaulting to today. On success the form SHALL clear and the debtors list SHALL refresh.

#### Scenario: Submit a payment
- **WHEN** the user selects a student, enters an amount and submits
- **THEN** the payment is created via the API, a success message is shown and the debtors list is refreshed

#### Scenario: Quick pay from the list
- **WHEN** the user taps a debtor in the list
- **THEN** the form is pre-filled with that student and their remaining debt as the amount

#### Scenario: API error
- **WHEN** the API rejects the payment (e.g. invalid amount)
- **THEN** the page shows the error message and keeps the entered values
