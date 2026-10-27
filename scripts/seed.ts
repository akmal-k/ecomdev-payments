// Fills the database with demo students and payments for the current month.
// Usage: npm run seed   (resets data in DB_PATH, default data/app.db)
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { openDb } from '../src/db.js';
import { studentsRepo } from '../src/students.js';
import { paymentsRepo } from '../src/payments.js';
import { currentMonth } from '../src/dates.js';

const dbPath = process.env.DB_PATH ?? 'data/app.db';
mkdirSync(dirname(dbPath), { recursive: true });
const db = openDb(dbPath);
db.exec('DELETE FROM payments; DELETE FROM students; DELETE FROM sqlite_sequence;');

const students = studentsRepo(db);
const payments = paymentsRepo(db);
const month = currentMonth();
const createdAt = `${month}-01`;

// [name, phone, group, monthly fee, payments in the current month]
const demo: [string, string, string, number, number[]][] = [
  ['Алишер Каримов', '+998901112233', 'IELTS-1', 600_000, [600_000]],
  ['Дилноза Юсупова', '+998935556677', 'IELTS-1', 600_000, [200_000, 100_000]],
  ['Тимур Ахмедов', '+998977778899', 'IELTS-1', 600_000, []],
  ['Мадина Рахимова', '+998901234567', 'Python-2', 800_000, [500_000]],
  ['Сардор Назаров', '+998946543210', 'Python-2', 800_000, [800_000, 100_000]],
  ['Нигора Исмоилова', '+998998887766', 'Math-Kids', 400_000, []],
];

const seed = db.transaction(() => {
  for (const [name, phone, group, monthlyFee, paid] of demo) {
    const s = students.create({ name, phone, group, monthlyFee }, createdAt);
    paid.forEach((amount, i) => payments.add(s.id, amount, `${month}-${String(i * 5 + 2).padStart(2, '0')}`));
  }
});
seed();

console.log(`Seeded ${demo.length} students into ${dbPath} for ${month}`);
db.close();
