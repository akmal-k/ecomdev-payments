import { describe, expect, it } from 'vitest';
import { today } from '../src/dates.js';
import { setup } from './helpers.js';

describe('payments API', () => {
  it('adds a payment with an explicit date', async () => {
    const { createStudent, pay } = setup();
    const s = await createStudent();
    const { status, body } = await pay(s.id, 300_000, '2026-10-05');
    expect(status).toBe(201);
    expect(body).toEqual({ id: expect.any(Number), studentId: s.id, amount: 300_000, date: '2026-10-05' });
  });

  it('defaults the date to today', async () => {
    const { call, createStudent } = setup();
    const s = await createStudent();
    const { status, body } = await call('POST', `/students/${s.id}/payments`, { amount: 300_000 });
    expect(status).toBe(201);
    expect(body.date).toBe(today());
  });

  it.each([
    ['zero amount', { amount: 0, date: '2026-10-05' }],
    ['negative amount', { amount: -100, date: '2026-10-05' }],
    ['fractional amount', { amount: 10.5, date: '2026-10-05' }],
    ['bad date format', { amount: 100, date: '05.10.2026' }],
    ['impossible date', { amount: 100, date: '2026-02-30' }],
  ])('rejects %s with 400 and stores nothing', async (_case, payload) => {
    const { call, createStudent } = setup();
    const s = await createStudent();
    expect((await call('POST', `/students/${s.id}/payments`, payload)).status).toBe(400);
    expect((await call('GET', `/students/${s.id}/payments`)).body).toEqual([]);
  });

  it('404s for unknown or deleted students', async () => {
    const { call, createStudent, pay } = setup();
    expect((await pay(999, 100, '2026-10-01')).status).toBe(404);
    expect((await call('GET', '/students/999/payments')).status).toBe(404);

    const s = await createStudent();
    await call('DELETE', `/students/${s.id}`);
    expect((await pay(s.id, 100, '2026-10-01')).status).toBe(404);
    expect((await call('GET', `/students/${s.id}/payments`)).status).toBe(404);
  });

  it('lists a student’s payments newest first, without other students’ payments', async () => {
    const { call, createStudent, pay } = setup();
    const a = await createStudent({ name: 'A' });
    const b = await createStudent({ name: 'B' });
    await pay(a.id, 100, '2026-09-10');
    await pay(a.id, 200, '2026-10-02');
    await pay(b.id, 999, '2026-10-03');

    const { status, body } = await call('GET', `/students/${a.id}/payments`);
    expect(status).toBe(200);
    expect(body.map((p: { amount: number }) => p.amount)).toEqual([200, 100]);
  });
});
