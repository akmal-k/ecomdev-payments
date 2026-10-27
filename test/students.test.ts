import { describe, expect, it } from 'vitest';
import { today } from '../src/dates.js';
import { setup } from './helpers.js';

const valid = { name: 'Ali Valiev', phone: '+998 90 123-45-67', group: 'IELTS-1', monthlyFee: 500_000 };

describe('students API', () => {
  it('creates a student and normalizes the phone', async () => {
    const { call } = setup();
    const { status, body } = await call('POST', '/students', valid);
    expect(status).toBe(201);
    expect(body).toEqual({
      id: expect.any(Number),
      name: 'Ali Valiev',
      phone: '+998901234567',
      group: 'IELTS-1',
      monthlyFee: 500_000,
      createdAt: today(),
    });
  });

  it.each([
    ['empty name', { ...valid, name: '  ' }],
    ['missing phone', { name: 'A', group: 'G', monthlyFee: 1 }],
    ['negative fee', { ...valid, monthlyFee: -1 }],
    ['fractional fee', { ...valid, monthlyFee: 100.5 }],
    ['fee as string', { ...valid, monthlyFee: '500000' }],
  ])('rejects %s with 400', async (_case, payload) => {
    const { call } = setup();
    const { status, body } = await call('POST', '/students', payload);
    expect(status).toBe(400);
    expect(body.details.length).toBeGreaterThan(0);
    expect((await call('GET', '/students')).body).toEqual([]);
  });

  it('lists students by name and filters by group', async () => {
    const { call, createStudent } = setup();
    await createStudent({ name: 'Zarina', group: 'A' });
    await createStudent({ name: 'Aziz', group: 'B' });

    const all = await call('GET', '/students');
    expect(all.body.map((s: { name: string }) => s.name)).toEqual(['Aziz', 'Zarina']);

    const groupA = await call('GET', '/students?group=A');
    expect(groupA.body.map((s: { name: string }) => s.name)).toEqual(['Zarina']);
  });

  it('gets one student or 404', async () => {
    const { call, createStudent } = setup();
    const s = await createStudent();
    expect((await call('GET', `/students/${s.id}`)).body.name).toBe('Ali Valiev');
    expect((await call('GET', '/students/999')).status).toBe(404);
    expect((await call('GET', '/students/abc')).status).toBe(400);
  });

  it('patches only the given fields', async () => {
    const { call, createStudent } = setup();
    const s = await createStudent();
    const { status, body } = await call('PATCH', `/students/${s.id}`, { monthlyFee: 600_000 });
    expect(status).toBe(200);
    expect(body).toMatchObject({ name: 'Ali Valiev', group: 'IELTS-1', monthlyFee: 600_000 });
  });

  it('rejects an empty or invalid patch and 404s on unknown student', async () => {
    const { call, createStudent } = setup();
    const s = await createStudent();
    expect((await call('PATCH', `/students/${s.id}`, {})).status).toBe(400);
    expect((await call('PATCH', `/students/${s.id}`, { monthlyFee: -5 })).status).toBe(400);
    expect((await call('PATCH', '/students/999', { name: 'X' })).status).toBe(404);
  });

  it('soft-deletes: hidden everywhere, payments kept in DB', async () => {
    const { app, call, createStudent, pay } = setup();
    const s = await createStudent();
    await pay(s.id, 100_000, '2026-10-01');

    expect((await call('DELETE', `/students/${s.id}`)).status).toBe(204);
    expect((await call('GET', `/students/${s.id}`)).status).toBe(404);
    expect((await call('GET', '/students')).body).toEqual([]);
    expect((await call('PATCH', `/students/${s.id}`, { name: 'X' })).status).toBe(404);
    expect((await call('DELETE', `/students/${s.id}`)).status).toBe(404);

    const kept = app.db.prepare('SELECT COUNT(*) AS n FROM payments WHERE student_id = ?').get(s.id) as { n: number };
    expect(kept.n).toBe(1);
  });
});
