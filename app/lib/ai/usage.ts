import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function getMonthStart(date: Date = new Date()): string {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  return monthStart.toISOString().slice(0, 10);
}

export async function checkAndIncrementAiUsage(
  userId: string,
  plan: string,
  isTest: boolean
): Promise<{ allowed: boolean; reason?: string }> {
  if (isTest) {
    return { allowed: true };
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const monthStart = getMonthStart();

  const { data: limit, error: limitError } = await supabase
    .from('ai_plan_limits')
    .select('monthly_requests')
    .eq('plan', plan)
    .single();

  if (limitError || !limit) {
    console.error('ai_plan_limits fetch error', limitError);
    return { allowed: false, reason: 'plan_not_configured' };
  }

  const { data: current, error: currentError } = await supabase
    .from('ai_usage')
    .select('requests')
    .eq('user_id', userId)
    .eq('month_start', monthStart)
    .maybeSingle();

  if (currentError) {
    console.error('ai_usage select error', currentError);
    return { allowed: false, reason: 'server_error' };
  }

  const currentCount = current?.requests ?? 0;

  if (currentCount >= limit.monthly_requests) {
    return { allowed: false, reason: 'quota_exceeded' };
  }

  const { error: upsertError } = await supabase
    .from('ai_usage')
    .upsert(
      { user_id: userId, month_start, requests: currentCount + 1 },
      { onConflict: 'user_id,month_start' }
    );

  if (upsertError) {
    console.error('ai_usage upsert error', upsertError);
    return { allowed: false, reason: 'server_error' };
  }

  return { allowed: true };
}


