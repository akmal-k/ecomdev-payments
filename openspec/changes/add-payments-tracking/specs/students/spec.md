## ADDED Requirements

### Requirement: Create student
The system SHALL create a student via `POST /students` with `name`, `phone`, `group` and `monthlyFee`, and return `201` with the stored student including `id` and `createdAt`.

#### Scenario: Valid student is created
- **WHEN** a client posts `{ "name": "Ali Valiev", "phone": "+998901234567", "group": "IELTS-1", "monthlyFee": 500000 }`
- **THEN** the system responds `201` with the student object containing a numeric `id` and today's `createdAt`

#### Scenario: Invalid input is rejected
- **WHEN** a client posts a student with an empty `name`, missing `phone`, or a `monthlyFee` that is negative or not an integer
- **THEN** the system responds `400` with an `error` message and validation `details`, and nothing is stored

### Requirement: List students
The system SHALL return all non-deleted students via `GET /students`, ordered by name, optionally filtered by `group`.

#### Scenario: List all students
- **WHEN** a client requests `GET /students`
- **THEN** the system responds `200` with an array of all non-deleted students

#### Scenario: Filter by group
- **WHEN** a client requests `GET /students?group=IELTS-1`
- **THEN** only students in group `IELTS-1` are returned

### Requirement: Get student
The system SHALL return a single non-deleted student via `GET /students/:id`.

#### Scenario: Unknown student
- **WHEN** a client requests a student id that does not exist or was deleted
- **THEN** the system responds `404`

### Requirement: Update student
The system SHALL partially update a student via `PATCH /students/:id`, applying the same validation as creation to each provided field.

#### Scenario: Change monthly fee
- **WHEN** a client patches `{ "monthlyFee": 600000 }` for an existing student
- **THEN** the system responds `200` with the updated student and other fields unchanged

#### Scenario: Update unknown student
- **WHEN** a client patches a student id that does not exist or was deleted
- **THEN** the system responds `404`

### Requirement: Delete student
The system SHALL soft-delete a student via `DELETE /students/:id`, hiding the student from lists, payment endpoints and the debtors report while keeping their payment history in the database.

#### Scenario: Delete existing student
- **WHEN** a client deletes an existing student
- **THEN** the system responds `204` and the student no longer appears in `GET /students` or `GET /debtors`

#### Scenario: Delete unknown student
- **WHEN** a client deletes a student id that does not exist or was already deleted
- **THEN** the system responds `404`
