export const LENS_TYPES = {
  daily:     { label: 'Однодневные',   short: '1 день',   days: 1 },
  biweekly:  { label: 'Двухнедельные', short: '2 недели', days: 14 },
  monthly:   { label: 'Месячные',      short: '1 месяц',  days: 30 },
  quarterly: { label: 'Квартальные',   short: '3 месяца', days: 90 },
};

export const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
export const MONTHS_LONG  = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function fmtShort(s) {
  const d = parseDate(s);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function fmtLong(s) {
  const d = parseDate(s);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function daysBetween(a, b) {
  const ms = parseDate(b) - parseDate(a);
  return Math.round(ms / 86400000);
}

export function pluralRu(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5)   return forms[1];
  if (b === 1)           return forms[0];
  return forms[2];
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Вычислить дату замены исходя из даты начала и типа линз */
export function calcReplaceDate(startDateISO, lensType) {
  const t = LENS_TYPES[lensType];
  if (!t) throw new Error(`Неизвестный тип линз: ${lensType}`);
  return toISODate(addDays(parseDate(startDateISO), t.days));
}

/** Процент прогресса ношения (0–100) */
export function calcProgress(startDateISO, replaceDateISO, todayISO_) {
  const total = daysBetween(startDateISO, replaceDateISO);
  if (total <= 0) return 100;
  const passed = Math.max(0, Math.min(total, daysBetween(startDateISO, todayISO_)));
  return Math.min(100, Math.max(0, (passed / total) * 100));
}

/** Количество дней до замены (отрицательное — просрочка) */
export function calcDaysLeft(replaceDateISO, todayISO_) {
  return daysBetween(todayISO_, replaceDateISO);
}
