import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DB } from './db.js';
import { today } from './dates.js';
import { idParams, notFound, parse } from './http.js';

export interface Student {
  id: number;
  name: string;
  phone: string;
  group: string;
  monthlyFee: number;
  createdAt: string;
}

interface StudentRow {
  id: number;
  name: string;
  phone: string;
  group_name: string;
  monthly_fee: number;
  created_at: string;
}

const toStudent = (r: StudentRow): Student => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  group: r.group_name,
  monthlyFee: r.monthly_fee,
  createdAt: r.created_at,
});

const studentInput = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{5,20}$/, 'Invalid phone number')
    .transform((p) => p.replace(/[\s()-]/g, '')),
  group: z.string().trim().min(1).max(100),
  monthlyFee: z.number().int().nonnegative(),
});

const studentPatch = studentInput
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'At least one field is required');

export type StudentInput = z.infer<typeof studentInput>;

export function studentsRepo(db: DB) {
  const SELECT = 'SELECT id, name, phone, group_name, monthly_fee, created_at FROM students';

  const get = (id: number): Student | undefined => {
    const row = db.prepare(`${SELECT} WHERE id = ? AND deleted_at IS NULL`).get(id) as StudentRow | undefined;
    return row && toStudent(row);
  };

  return {
    get,

    list(group?: string): Student[] {
      const rows = group
        ? db.prepare(`${SELECT} WHERE deleted_at IS NULL AND group_name = ? ORDER BY name`).all(group)
        : db.prepare(`${SELECT} WHERE deleted_at IS NULL ORDER BY name`).all();
      return (rows as StudentRow[]).map(toStudent);
    },

    create(input: StudentInput, createdAt = today()): Student {
      const { lastInsertRowid } = db
        .prepare('INSERT INTO students (name, phone, group_name, monthly_fee, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(input.name, input.phone, input.group, input.monthlyFee, createdAt);
      return get(Number(lastInsertRowid))!;
    },

    update(id: number, patch: Partial<StudentInput>): Student | undefined {
      const current = get(id);
      if (!current) return undefined;
      const next = { ...current, ...patch };
      db.prepare('UPDATE students SET name = ?, phone = ?, group_name = ?, monthly_fee = ? WHERE id = ?').run(
        next.name,
        next.phone,
        next.group,
        next.monthlyFee,
        id,
      );
      return get(id);
    },

    remove(id: number): boolean {
      const { changes } = db
        .prepare('UPDATE students SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL')
        .run(today(), id);
      return changes > 0;
    },
  };
}

export type StudentsRepo = ReturnType<typeof studentsRepo>;

export function studentRoutes(app: FastifyInstance, students: StudentsRepo) {
  app.post('/students', async (req, reply) => {
    const input = parse(studentInput, req.body);
    reply.code(201);
    return students.create(input);
  });

  app.get('/students', async (req) => {
    const { group } = parse(z.object({ group: z.string().trim().min(1).optional() }), req.query);
    return students.list(group);
  });

  app.get('/students/:id', async (req) => {
    const { id } = parse(idParams, req.params);
    return students.get(id) ?? notFound('Student');
  });

  app.patch('/students/:id', async (req) => {
    const { id } = parse(idParams, req.params);
    const patch = parse(studentPatch, req.body);
    return students.update(id, patch) ?? notFound('Student');
  });

  app.delete('/students/:id', async (req, reply) => {
    const { id } = parse(idParams, req.params);
    if (!students.remove(id)) notFound('Student');
    reply.code(204);
  });
}
