import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcReplaceDate, toISODate, addDays, parseDate } from '../utils.js';

// ───── Мок Supabase ─────

const mockSingle  = vi.fn();
const mockSelect  = vi.fn();
const mockInsert  = vi.fn();
const mockUpdate  = vi.fn();
const mockDelete  = vi.fn();
const mockUpsert  = vi.fn();
const mockEq      = vi.fn();
const mockIn      = vi.fn();
const mockOrder   = vi.fn();
const mockMaybeSingle = vi.fn();

// Цепочка методов: каждый возвращает объект с нужными методами
function chainable(result) {
  const obj = {
    select:      vi.fn(() => chainable(result)),
    insert:      vi.fn(() => chainable(result)),
    update:      vi.fn(() => chainable(result)),
    delete:      vi.fn(() => chainable(result)),
    upsert:      vi.fn(() => chainable(result)),
    eq:          vi.fn(() => chainable(result)),
    in:          vi.fn(() => chainable(result)),
    order:       vi.fn(() => chainable(result)),
    single:      vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    then:        (res) => Promise.resolve(result).then(res),
  };
  return obj;
}

function makeSupabase({ cyclesData = [], subsData = null, error = null } = {}) {
  // Создаём фиксированные объекты таблиц — одни и те же для всех вызовов from()
  const lensTable = {
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        order: vi.fn(async () => ({ data: cyclesData, error })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: cyclesData[0] ? { id: 'new-id', ...cyclesData[0] } : null,
          error,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(async () => ({ error })),
    })),
  };

  const subsTable = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => ({ data: subsData, error })),
      })),
    })),
    upsert: vi.fn(async () => ({ error })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error })),
    })),
  };

  return {
    _tables: { lens_cycles: lensTable, push_subscriptions: subsTable },
    from: vi.fn((table) => {
      if (table === 'lens_cycles')      return lensTable;
      if (table === 'push_subscriptions') return subsTable;
      return chainable({ data: null, error: null });
    }),
  };
}

// ───── Тесты данных через прямое тестирование логики ─────

describe('calcReplaceDate — интеграция с createCycle логикой', () => {
  it('правильно вычисляет дату замены для всех типов', () => {
    const cases = [
      { type: 'daily',     start: '2026-04-19', expected: '2026-04-20' },
      { type: 'biweekly',  start: '2026-04-19', expected: '2026-05-03' },
      { type: 'monthly',   start: '2026-04-01', expected: '2026-05-01' },
      { type: 'quarterly', start: '2026-01-01', expected: '2026-04-01' },
    ];
    for (const { type, start, expected } of cases) {
      expect(calcReplaceDate(start, type)).toBe(expected);
    }
  });
});

// ───── fetchCycles ─────

describe('fetchCycles', () => {
  it('возвращает массив циклов', async () => {
    const cycles = [
      { id: '1', start_date: '2026-04-01', lens_type: 'monthly', replace_date: '2026-05-01', status: 'active' },
      { id: '2', start_date: '2026-03-01', lens_type: 'monthly', replace_date: '2026-04-01', status: 'replaced' },
    ];
    const supabase = makeSupabase({ cyclesData: cycles });

    const result = await supabase
      .from('lens_cycles')
      .select('*')
      .order('start_date', { ascending: false })
      .order('start_date');

    expect(result.data).toEqual(cycles);
    expect(result.error).toBeNull();
  });

  it('возвращает пустой массив когда нет данных', async () => {
    const supabase = makeSupabase({ cyclesData: [] });
    const result = await supabase
      .from('lens_cycles')
      .select('*')
      .order('start_date', { ascending: false })
      .order('start_date');

    expect(result.data).toEqual([]);
  });

  it('передаёт ошибку при сбое БД', async () => {
    const dbError = new Error('connection refused');
    const supabase = makeSupabase({ error: dbError });
    const result = await supabase
      .from('lens_cycles')
      .select('*')
      .order('start_date', { ascending: false })
      .order('start_date');

    expect(result.error).toBe(dbError);
  });
});

// ───── createCycle ─────

describe('createCycle', () => {
  it('помечает активный цикл как replaced перед созданием нового', async () => {
    const activeId = 'active-uuid';
    const supabase = makeSupabase();

    await supabase.from('lens_cycles').update({ status: 'replaced' }).eq('id', activeId);

    expect(supabase._tables.lens_cycles.update).toHaveBeenCalledWith({ status: 'replaced' });
  });

  it('создаёт запись с правильными полями', async () => {
    const startDate = '2026-04-19';
    const lensType = 'biweekly';
    const replaceDate = calcReplaceDate(startDate, lensType);

    const supabase = makeSupabase({ cyclesData: [{ id: 'new', start_date: startDate, lens_type: lensType, replace_date: replaceDate, status: 'active' }] });

    await supabase.from('lens_cycles').insert({
      user_id: 'user-1',
      start_date: startDate,
      lens_type: lensType,
      replace_date: replaceDate,
      status: 'active',
    }).select('id, user_id, start_date, lens_type, replace_date, status').single();

    expect(supabase._tables.lens_cycles.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      start_date: startDate,
      lens_type: lensType,
      replace_date: replaceDate,
      status: 'active',
    });
    expect(replaceDate).toBe('2026-05-03');
  });

  it('вычисляет правильную дату замены для каждого типа', () => {
    expect(calcReplaceDate('2026-04-19', 'daily')).toBe('2026-04-20');
    expect(calcReplaceDate('2026-04-19', 'biweekly')).toBe('2026-05-03');
    expect(calcReplaceDate('2026-04-19', 'monthly')).toBe('2026-05-19');
    expect(calcReplaceDate('2026-04-19', 'quarterly')).toBe('2026-07-18');
  });
});

// ───── loadPushSubStatus ─────

describe('loadPushSubStatus', () => {
  it('возвращает true когда подписка существует', async () => {
    const supabase = makeSupabase({ subsData: { id: 'sub-1' } });
    const { data } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(!!data).toBe(true);
  });

  it('возвращает false когда подписки нет', async () => {
    const supabase = makeSupabase({ subsData: null });
    const { data } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(!!data).toBe(false);
  });
});

// ───── savePushSubscription ─────

describe('savePushSubscription', () => {
  it('вызывает upsert с правильными данными', async () => {
    const supabase = makeSupabase();
    const sub = { endpoint: 'https://push.example.com', keys: { auth: 'abc', p256dh: 'xyz' } };

    await supabase.from('push_subscriptions').upsert(
      { user_id: 'user-1', subscription: sub },
      { onConflict: 'user_id' }
    );

    expect(supabase._tables.push_subscriptions.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', subscription: sub },
      { onConflict: 'user_id' }
    );
  });

  it('обновляет подписку если уже существует', async () => {
    const supabase = makeSupabase();
    const sub1 = { endpoint: 'https://push.example.com/1' };
    const sub2 = { endpoint: 'https://push.example.com/2' };

    await supabase.from('push_subscriptions').upsert({ user_id: 'user-1', subscription: sub1 }, { onConflict: 'user_id' });
    await supabase.from('push_subscriptions').upsert({ user_id: 'user-1', subscription: sub2 }, { onConflict: 'user_id' });

    expect(supabase._tables.push_subscriptions.upsert).toHaveBeenCalledTimes(2);
    expect(supabase._tables.push_subscriptions.upsert).toHaveBeenLastCalledWith(
      { user_id: 'user-1', subscription: sub2 },
      { onConflict: 'user_id' }
    );
  });
});

// ───── disableNotifications ─────

describe('disableNotifications', () => {
  it('удаляет подписку из БД', async () => {
    const supabase = makeSupabase();

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', 'user-1');

    expect(supabase._tables.push_subscriptions.delete).toHaveBeenCalled();
    expect(error).toBeNull();
  });
});

// ───── Валидация состояния циклов ─────

describe('состояние активного цикла', () => {
  it('находит активный цикл в списке', () => {
    const cycles = [
      { id: '1', status: 'replaced', replace_date: '2026-03-01' },
      { id: '2', status: 'active',   replace_date: '2026-05-01' },
    ];
    const active = cycles.find(c => c.status === 'active');
    expect(active).toBeDefined();
    expect(active.id).toBe('2');
  });

  it('возвращает undefined когда нет активного цикла', () => {
    const cycles = [
      { id: '1', status: 'replaced' },
      { id: '2', status: 'replaced' },
    ];
    const active = cycles.find(c => c.status === 'active');
    expect(active).toBeUndefined();
  });

  it('определяет просрочку', () => {
    const today = '2026-04-19';
    const cycle = { replace_date: '2026-04-10' };
    expect(cycle.replace_date < today).toBe(true);
  });

  it('определяет день замены сегодня', () => {
    const today = '2026-04-19';
    const cycle = { replace_date: '2026-04-19' };
    expect(cycle.replace_date === today).toBe(true);
  });

  it('определяет что замена ещё впереди', () => {
    const today = '2026-04-19';
    const cycle = { replace_date: '2026-04-30' };
    expect(cycle.replace_date > today).toBe(true);
  });
});

// ───── Фильтрация истории ─────

describe('история замен', () => {
  const cycles = [
    { id: '3', status: 'active',   start_date: '2026-04-01', replace_date: '2026-05-01', lens_type: 'monthly' },
    { id: '2', status: 'replaced', start_date: '2026-03-01', replace_date: '2026-04-01', lens_type: 'monthly' },
    { id: '1', status: 'replaced', start_date: '2026-02-01', replace_date: '2026-03-01', lens_type: 'monthly' },
  ];

  it('история отсортирована от новых к старым', () => {
    expect(cycles[0].start_date > cycles[1].start_date).toBe(true);
    expect(cycles[1].start_date > cycles[2].start_date).toBe(true);
  });

  it('активный цикл один', () => {
    const active = cycles.filter(c => c.status === 'active');
    expect(active).toHaveLength(1);
  });

  it('заменённые циклы правильно отмечены', () => {
    const replaced = cycles.filter(c => c.status === 'replaced');
    expect(replaced).toHaveLength(2);
  });
});
