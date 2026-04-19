import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseDate, toISODate, todayISO, addDays,
  fmtShort, fmtLong, daysBetween, pluralRu,
  calcReplaceDate, calcProgress, calcDaysLeft,
  LENS_TYPES,
} from '../utils.js';

// ───── parseDate ─────

describe('parseDate', () => {
  it('парсит корректную дату', () => {
    const d = parseDate('2026-04-19');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // апрель = 3
    expect(d.getDate()).toBe(19);
  });

  it('возвращает null при пустой строке', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });

  it('парсит начало года', () => {
    const d = parseDate('2026-01-01');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it('парсит конец года', () => {
    const d = parseDate('2026-12-31');
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});

// ───── toISODate ─────

describe('toISODate', () => {
  it('форматирует дату в ISO строку', () => {
    expect(toISODate(new Date(2026, 3, 19))).toBe('2026-04-19');
  });

  it('добавляет ведущие нули для месяца и дня', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('корректен для конца года', () => {
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

// ───── todayISO ─────

describe('todayISO', () => {
  it('возвращает строку формата YYYY-MM-DD', () => {
    const today = todayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('совпадает с текущей датой', () => {
    const d = new Date();
    const expected = toISODate(d);
    expect(todayISO()).toBe(expected);
  });
});

// ───── addDays ─────

describe('addDays', () => {
  it('добавляет дни к дате', () => {
    const result = addDays(new Date(2026, 3, 19), 14);
    expect(toISODate(result)).toBe('2026-05-03');
  });

  it('добавляет 1 день', () => {
    expect(toISODate(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
  });

  it('добавляет 0 дней — дата не меняется', () => {
    const d = new Date(2026, 3, 19);
    expect(toISODate(addDays(d, 0))).toBe('2026-04-19');
  });

  it('корректно переходит через конец года', () => {
    expect(toISODate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
  });

  it('работает с ISO-строкой через parseDate', () => {
    expect(toISODate(addDays(parseDate('2026-04-19'), 30))).toBe('2026-05-19');
  });

  it('не мутирует исходную дату', () => {
    const original = new Date(2026, 3, 19);
    addDays(original, 10);
    expect(toISODate(original)).toBe('2026-04-19');
  });
});

// ───── daysBetween ─────

describe('daysBetween', () => {
  it('считает дни между датами', () => {
    expect(daysBetween('2026-04-01', '2026-04-15')).toBe(14);
  });

  it('возвращает 0 для одинаковых дат', () => {
    expect(daysBetween('2026-04-19', '2026-04-19')).toBe(0);
  });

  it('возвращает отрицательное значение если b < a', () => {
    expect(daysBetween('2026-04-15', '2026-04-01')).toBe(-14);
  });

  it('корректно считает через смену месяца', () => {
    expect(daysBetween('2026-01-31', '2026-02-28')).toBe(28);
  });

  it('корректно считает через смену года', () => {
    expect(daysBetween('2026-12-25', '2027-01-01')).toBe(7);
  });
});

// ───── fmtShort ─────

describe('fmtShort', () => {
  it('форматирует дату в короткий вид', () => {
    expect(fmtShort('2026-04-19')).toBe('19 апр');
  });

  it('январь', () => {
    expect(fmtShort('2026-01-01')).toBe('1 янв');
  });

  it('декабрь', () => {
    expect(fmtShort('2026-12-31')).toBe('31 дек');
  });

  it('возвращает пустую строку для пустого значения', () => {
    expect(fmtShort('')).toBe('');
    expect(fmtShort(null)).toBe('');
  });
});

// ───── fmtLong ─────

describe('fmtLong', () => {
  it('форматирует дату в длинный вид', () => {
    expect(fmtLong('2026-04-19')).toBe('19 апреля 2026');
  });

  it('январь в родительном падеже', () => {
    expect(fmtLong('2026-01-01')).toBe('1 января 2026');
  });

  it('декабрь в родительном падеже', () => {
    expect(fmtLong('2026-12-31')).toBe('31 декабря 2026');
  });

  it('возвращает пустую строку для пустого значения', () => {
    expect(fmtLong('')).toBe('');
  });
});

// ───── pluralRu ─────

describe('pluralRu', () => {
  const forms = ['день', 'дня', 'дней'];

  it('1 — первая форма', () => {
    expect(pluralRu(1, forms)).toBe('день');
    expect(pluralRu(21, forms)).toBe('день');
    expect(pluralRu(101, forms)).toBe('день');
  });

  it('2–4 — вторая форма', () => {
    expect(pluralRu(2, forms)).toBe('дня');
    expect(pluralRu(3, forms)).toBe('дня');
    expect(pluralRu(4, forms)).toBe('дня');
    expect(pluralRu(22, forms)).toBe('дня');
  });

  it('5–20 — третья форма', () => {
    expect(pluralRu(5, forms)).toBe('дней');
    expect(pluralRu(11, forms)).toBe('дней');
    expect(pluralRu(15, forms)).toBe('дней');
    expect(pluralRu(20, forms)).toBe('дней');
  });

  it('11–19 всегда третья форма', () => {
    expect(pluralRu(11, forms)).toBe('дней');
    expect(pluralRu(12, forms)).toBe('дней');
    expect(pluralRu(13, forms)).toBe('дней');
    expect(pluralRu(14, forms)).toBe('дней');
    expect(pluralRu(19, forms)).toBe('дней');
    expect(pluralRu(111, forms)).toBe('дней');
  });

  it('0 — третья форма', () => {
    expect(pluralRu(0, forms)).toBe('дней');
  });

  it('работает с отрицательными числами', () => {
    expect(pluralRu(-1, forms)).toBe('день');
    expect(pluralRu(-5, forms)).toBe('дней');
  });
});

// ───── LENS_TYPES ─────

describe('LENS_TYPES', () => {
  it('содержит все 4 типа линз', () => {
    expect(Object.keys(LENS_TYPES)).toEqual(['daily', 'biweekly', 'monthly', 'quarterly']);
  });

  it('однодневные — 1 день', () => {
    expect(LENS_TYPES.daily.days).toBe(1);
  });

  it('двухнедельные — 14 дней', () => {
    expect(LENS_TYPES.biweekly.days).toBe(14);
  });

  it('месячные — 30 дней', () => {
    expect(LENS_TYPES.monthly.days).toBe(30);
  });

  it('квартальные — 90 дней', () => {
    expect(LENS_TYPES.quarterly.days).toBe(90);
  });

  it('каждый тип имеет label и short', () => {
    for (const t of Object.values(LENS_TYPES)) {
      expect(t.label).toBeTruthy();
      expect(t.short).toBeTruthy();
    }
  });
});

// ───── calcReplaceDate ─────

describe('calcReplaceDate', () => {
  it('однодневные: замена через 1 день', () => {
    expect(calcReplaceDate('2026-04-19', 'daily')).toBe('2026-04-20');
  });

  it('двухнедельные: замена через 14 дней', () => {
    expect(calcReplaceDate('2026-04-19', 'biweekly')).toBe('2026-05-03');
  });

  it('месячные: замена через 30 дней', () => {
    expect(calcReplaceDate('2026-04-01', 'monthly')).toBe('2026-05-01');
  });

  it('квартальные: замена через 90 дней', () => {
    expect(calcReplaceDate('2026-01-01', 'quarterly')).toBe('2026-04-01');
  });

  it('выбрасывает ошибку для неизвестного типа', () => {
    expect(() => calcReplaceDate('2026-04-19', 'unknown')).toThrow('Неизвестный тип линз: unknown');
  });
});

// ───── calcProgress ─────

describe('calcProgress', () => {
  it('0% в начале цикла', () => {
    expect(calcProgress('2026-04-19', '2026-05-03', '2026-04-19')).toBe(0);
  });

  it('100% в конце цикла', () => {
    expect(calcProgress('2026-04-19', '2026-05-03', '2026-05-03')).toBe(100);
  });

  it('50% на середине цикла', () => {
    expect(calcProgress('2026-04-01', '2026-04-15', '2026-04-08')).toBeCloseTo(50, 0);
  });

  it('не выходит за 100% при просрочке', () => {
    expect(calcProgress('2026-04-01', '2026-04-15', '2026-05-01')).toBe(100);
  });

  it('не опускается ниже 0%', () => {
    expect(calcProgress('2026-04-10', '2026-04-20', '2026-04-05')).toBe(0);
  });
});

// ───── calcDaysLeft ─────

describe('calcDaysLeft', () => {
  it('положительное значение до замены', () => {
    expect(calcDaysLeft('2026-04-30', '2026-04-19')).toBe(11);
  });

  it('0 в день замены', () => {
    expect(calcDaysLeft('2026-04-19', '2026-04-19')).toBe(0);
  });

  it('отрицательное значение при просрочке', () => {
    expect(calcDaysLeft('2026-04-01', '2026-04-10')).toBe(-9);
  });
});
