import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DB } from './db.js';
import { currentMonth, isValidMonth, monthRange } from './dates.js';
import { parse } from './http.js';

export interface Debtor {
  id: number;
  name: string;
  phone: string;
  group: string;
  monthlyFee: number;
  paid: number;
  debt: number;
}

export interface DebtorsReport {
  month: string;
  total: number;
  debtors: Debtor[];
}

/**
 * Debt for a month = current monthly fee − payments dated within that calendar month.
 * Students created after the month ends and deleted students are excluded.
 * Overpayment does not carry over to other months.
 */
export function debtorsReport(db: DB, month: string): DebtorsReport {
  const { from, to } = monthRange(month);
  const debtors = db
    .prepare(
      `SELECT s.id, s.name, s.phone, s.group_name AS "group", s.monthly_fee AS monthlyFee,
              COALESCE(SUM(p.amount), 0) AS paid,
              s.monthly_fee - COALESCE(SUM(p.amount), 0) AS debt
         FROM students s
         LEFT JOIN payments p ON p.student_id = s.id AND p.paid_on BETWEEN @from AND @to
        WHERE s.deleted_at IS NULL AND s.created_at <= @to
        GROUP BY s.id
       HAVING debt > 0
        ORDER BY debt DESC, s.name`,
    )
    .all({ from, to }) as Debtor[];
  return { month, total: debtors.reduce((sum, d) => sum + d.debt, 0), debtors };
}

const query = z.object({
  month: z.string().refine(isValidMonth, 'Expected a valid month in YYYY-MM format').optional(),
});

export function debtorRoutes(app: FastifyInstance, db: DB) {
  app.get('/debtors', async (req) => {
    const { month } = parse(query, req.query);
    return debtorsReport(db, month ?? currentMonth());
  });
}
