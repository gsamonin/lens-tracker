import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails(
  'mailto:gsamonin02@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

Deno.serve(async (req) => {
  // Проверка cron-заголовка (безопасность)
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const today = new Date().toISOString().split('T')[0];

  // Найти все активные циклы у которых сегодня день замены
  const { data: cycles, error: cyclesError } = await supabase
    .from('lens_cycles')
    .select('user_id')
    .eq('status', 'active')
    .eq('replace_date', today);

  if (cyclesError) {
    console.error('Cycles error:', cyclesError);
    return new Response(JSON.stringify({ error: cyclesError.message }), { status: 500 });
  }

  if (!cycles || cycles.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No cycles due today' }), { status: 200 });
  }

  const userIds = cycles.map((c) => c.user_id);

  // Получить push-подписки этих пользователей
  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .in('user_id', userIds);

  if (subsError) {
    console.error('Subs error:', subsError);
    return new Response(JSON.stringify({ error: subsError.message }), { status: 500 });
  }

  const payload = JSON.stringify({
    title: 'Пора менять линзы 👁️',
    body: 'Сегодня день замены — не забудь!',
  });

  let sent = 0;
  let failed = 0;

  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(row.subscription, payload);
      sent++;
    } catch (err) {
      console.error('Push failed:', err);
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
