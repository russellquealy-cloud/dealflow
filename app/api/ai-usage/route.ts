import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';
import { getUserSubscriptionTier } from '@/lib/subscription';
import { getPlanLimits } from '@/lib/subscription';
import type { SubscriptionTier } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getMonthStart(date: Date = new Date()): string {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  return monthStart.toISOString().slice(0, 10);
}

function getNextMonthStart(date: Date = new Date()): string {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return nextMonth.toISOString().slice(0, 10);
}

/**
 * GET /api/ai-usage
 * Returns AI usage for the current user or admin overview
 * Query params:
 *   - userId: (admin only) Get usage for specific user
 *   - tier: (admin only) Get usage aggregated by tier
 *   - errors: (admin only) Include error logs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    
    // Try to get user from session (cookies)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('AI usage API: getUser error', userError);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const tierFilter = searchParams.get('tier');
    const includeErrors = searchParams.get('errors') === 'true';

    // Check if admin
    const userIsAdmin = await isAdmin(user.id, supabase);

    // Admin-only: Get usage by user
    if (targetUserId && userIsAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, tier, segment')
        .eq('id', targetUserId)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const monthStart = getMonthStart();
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('requests, month_start')
        .eq('user_id', targetUserId)
        .eq('month_start', monthStart)
        .maybeSingle();

      const tier = (profile.tier?.toUpperCase() || 'FREE') as SubscriptionTier;
      const limits = getPlanLimits(tier);
      const limit = limits.ai_analyses ?? 0;

      return NextResponse.json({
        userId: targetUserId,
        email: profile.email,
        tier: profile.tier,
        segment: profile.segment,
        used: usage?.requests ?? 0,
        limit: limit === -1 ? null : limit,
        remaining: limit === -1 ? null : Math.max(0, limit - (usage?.requests ?? 0)),
        resetsOn: getNextMonthStart(),
        monthStart,
      });
    }

    // Admin-only: Get usage aggregated by tier
    if (tierFilter && userIsAdmin) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, tier')
        .eq('tier', tierFilter.toLowerCase());

      if (!profiles || profiles.length === 0) {
        return NextResponse.json({ usageByTier: [], totalUsers: 0, totalUsed: 0 });
      }

      const userIds = profiles.map((p) => p.id);
      const monthStart = getMonthStart();

      const { data: usageData } = await supabase
        .from('ai_usage')
        .select('user_id, requests')
        .in('user_id', userIds)
        .eq('month_start', monthStart);

      const usageMap = new Map<string, number>();
      usageData?.forEach((u) => {
        usageMap.set(u.user_id, u.requests);
      });

      const totalUsed = Array.from(usageMap.values()).reduce((sum, count) => sum + count, 0);
      const usersWithUsage = usageMap.size;
      const averageUsage = usersWithUsage > 0 ? Math.round(totalUsed / usersWithUsage) : 0;

      return NextResponse.json({
        tier: tierFilter,
        totalUsers: profiles.length,
        usersWithUsage,
        totalUsed,
        averageUsage,
        monthStart,
      });
    }

    // Admin-only: Get error logs
    if (includeErrors && userIsAdmin) {
      const { data: errors } = await supabase
        .from('ai_analysis_logs')
        .select('id, user_id, created_at, analysis_type, cost_cents')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', errors?.map((e) => e.user_id) ?? []);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) ?? []);

      return NextResponse.json({
        errors: errors?.map((e) => ({
          id: e.id,
          userId: e.user_id,
          userEmail: profileMap.get(e.user_id) ?? null,
          createdAt: e.created_at,
          analysisType: e.analysis_type,
          costCents: e.cost_cents,
        })) ?? [],
      });
    }

    // Regular user: Get their own usage
    const monthStart = getMonthStart();
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('requests, month_start')
      .eq('user_id', user.id)
      .eq('month_start', monthStart)
      .maybeSingle();

    const tier = await getUserSubscriptionTier(user.id, supabase);
    const limits = getPlanLimits(tier);
    const limit = limits.ai_analyses ?? 0;

    return NextResponse.json({
      used: usage?.requests ?? 0,
      limit: limit === -1 ? null : limit,
      remaining: limit === -1 ? null : Math.max(0, limit - (usage?.requests ?? 0)),
      resetsOn: getNextMonthStart(),
      monthStart,
      tier,
    });
  } catch (error) {
    console.error('Error in AI usage API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

