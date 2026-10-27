import { afterEach } from 'vitest';
import { buildApp } from '../src/app.js';

type App = ReturnType<typeof buildApp>;
const apps: App[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => a.close()));
});

export function setup() {
  const app = buildApp();
  apps.push(app);

  const call = async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) => {
    const res = await app.inject({ method, url, payload });
    return { status: res.statusCode, body: res.body ? res.json() : undefined };
  };

  const createStudent = async (overrides: Record<string, unknown> = {}, createdAt = '2026-01-01') => {
    const { status, body } = await call('POST', '/students', {
      name: 'Ali Valiev',
      phone: '+998901234567',
      group: 'IELTS-1',
      monthlyFee: 500_000,
      ...overrides,
    });
    if (status !== 201) throw new Error(`createStudent failed: ${JSON.stringify(body)}`);
    app.db.prepare('UPDATE students SET created_at = ? WHERE id = ?').run(createdAt, body.id);
    return body as { id: number; name: string };
  };

  const pay = (studentId: number, amount: number, date: string) =>
    call('POST', `/students/${studentId}/payments`, { amount, date });

  return { app, call, createStudent, pay };
}
