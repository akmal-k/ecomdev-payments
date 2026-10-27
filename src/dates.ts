// All dates are plain 'YYYY-MM-DD' strings in the server's local timezone (TZ, Asia/Tashkent by default).

const pad = (n: number) => String(n).padStart(2, '0');

export function today(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentMonth(now = new Date()): string {
  return today(now).slice(0, 7);
}

export function isValidDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

export function isValidMonth(value: string): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

/** First and last day of a 'YYYY-MM' month, inclusive. */
export function monthRange(month: string): { from: string; to: string } {
  const [y, mo] = month.split('-').map(Number);
  return { from: `${month}-01`, to: `${month}-${pad(daysInMonth(y, mo))}` };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
