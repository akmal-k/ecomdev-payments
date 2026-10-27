import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DB } from './db.js';
import { isValidDate, today } from './dates.js';
import { idParams, notFound, parse } from './http.js';
import type { StudentsRepo } from './students.js';

export interface Payment {
  id: number;
  studentId: number;
  amount: number;
  date: string;
}

const paymentInput = z.object({
  amount: z.number().int().positive(),
  date: z.string().refine(isValidDate, 'Expected a valid date in YYYY-MM-DD format').optional(),
});

const SELECT = 'SELECT id, student_id AS studentId, amount, paid_on AS date FROM payments';

export function paymentsRepo(db: DB) {
  return {
    add(studentId: number, amount: number, date: string): Payment {
      const { lastInsertRowid } = db
        .prepare('INSERT INTO payments (student_id, amount, paid_on, created_at) VALUES (?, ?, ?, ?)')
        .run(studentId, amount, date, new Date().toISOString());
      return db.prepare(`${SELECT} WHERE id = ?`).get(lastInsertRowid) as Payment;
    },

    listByStudent(studentId: number): Payment[] {
      return db.prepare(`${SELECT} WHERE student_id = ? ORDER BY paid_on DESC, id DESC`).all(studentId) as Payment[];
    },
  };
}

export type PaymentsRepo = ReturnType<typeof paymentsRepo>;

export function paymentRoutes(app: FastifyInstance, payments: PaymentsRepo, students: StudentsRepo) {
  app.post('/students/:id/payments', async (req, reply) => {
    const { id } = parse(idParams, req.params);
    const input = parse(paymentInput, req.body);
    if (!students.get(id)) notFound('Student');
    reply.code(201);
    return payments.add(id, input.amount, input.date ?? today());
  });

  app.get('/students/:id/payments', async (req) => {
    const { id } = parse(idParams, req.params);
    if (!students.get(id)) notFound('Student');
    return payments.listByStudent(id);
  });
}
