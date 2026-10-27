import { describe, expect, it } from 'vitest';
import { currentMonth } from '../src/dates.js';
import { setup } from './helpers.js';

const october = '/debtors?month=2026-10';

describe('GET /debtors', () => {
  it('lists a partial payer with the remaining debt', async () => {
    const { call, createStudent, pay } = setup();
    const s = await createStudent({ monthlyFee: 500_000 });
    await pay(s.id, 200_000, '2026-10-03');

    const { status, body } = await call('GET', october);
    expect(status).toBe(200);
    expect(body.month).toBe('2026-10');
    expect(body.debtors).toEqual([
      expect.objectContaining({ id: s.id, monthlyFee: 500_000, paid: 200_000, debt: 300_000 }),
    ]);
    expect(body.total).toBe(300_000);
  });

  it('lists a student with no payments for the full fee', async () => {
    const { call, createStudent } = setup();
    await createStudent({ monthlyFee: 400_000 });

    const { body } = await call('GET', october);
    expect(body.debtors[0]).toMatchObject({ paid: 0, debt: 400_000 });
  });

  it('sums several payments within the month', async () => {
    const { call, createStudent, pay } = setup();
    const s = await createStudent({ monthlyFee: 500_000 });
    await pay(s.id, 100_000, '2026-10-01');
    await pay(s.id, 150_000, '2026-10-31');

    const { body } = await call('GET', october);
    expect(body.debtors[0]).toMatchObject({ paid: 250_000, debt: 250_000 });
  });

  it('excludes students who paid in full or overpaid', async () => {
    const { call, createStudent, pay } = setup();
    const exact = await createStudent({ name: 'Exact' });
    const over = await createStudent({ name: 'Over' });
    await pay(exact.id, 500_000, '2026-10-10');
    await pay(over.id, 900_000, '2026-10-10');

    const { body } = await call('GET', october);
    expect(body.debtors).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('ignores payments from other months', async () => {
    const { call, createStudent, pay } = setup();
    const s = await createStudent();
    await pay(s.id, 500_000, '2026-09-30');
    await pay(s.id, 500_000, '2026-11-01');

    const { body } = await call('GET', october);
    expect(body.debtors[0]).toMatchObject({ id: s.id, paid: 0, debt: 500_000 });
  });

  it('excludes students created after the month, includes those created during it', async () => {
    const { call, createStudent } = setup();
    await createStudent({ name: 'Late' }, '2026-11-02');
    const mid = await createStudent({ name: 'Mid' }, '2026-10-25');

    const { body } = await call('GET', october);
    expect(body.debtors.map((d: { id: number }) => d.id)).toEqual([mid.id]);
  });

  it('excludes deleted students', async () => {
    const { call, createStudent } = setup();
    const s = await createStudent();
    await call('DELETE', `/students/${s.id}`);

    const { body } = await call('GET', october);
    expect(body.debtors).toEqual([]);
  });

  it('excludes students with a zero fee', async () => {
    const { call, createStudent } = setup();
    await createStudent({ monthlyFee: 0 });

    const { body } = await call('GET', october);
    expect(body.debtors).toEqual([]);
  });

  it('sorts by debt descending, then by name', async () => {
    const { call, createStudent } = setup();
    await createStudent({ name: 'Bobur', monthlyFee: 300_000 });
    await createStudent({ name: 'Aziz', monthlyFee: 300_000 });
    await createStudent({ name: 'Zarina', monthlyFee: 900_000 });

    const { body } = await call('GET', october);
    expect(body.debtors.map((d: { name: string }) => d.name)).toEqual(['Zarina', 'Aziz', 'Bobur']);
  });

  it('defaults to the current month', async () => {
    const { call } = setup();
    const { status, body } = await call('GET', '/debtors');
    expect(status).toBe(200);
    expect(body.month).toBe(currentMonth());
  });

  it.each(['2026-13', '2026-1', 'oct', '2026-10-01'])('rejects invalid month %s', async (month) => {
    const { call } = setup();
    const { status, body } = await call('GET', `/debtors?month=${month}`);
    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });
});
