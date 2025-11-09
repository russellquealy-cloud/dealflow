import { NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth/server';
import { getUserAnalytics, UserAnalytics, UserRole } from '@/lib/analytics';

export const runtime = 'nodejs';

type AnalyticsResponse =
  | { stats: UserAnalytics; isPro: boolean }
  | { error: string };

function resolveRole(input?: string | null): UserRole | null {
  if (!input) return null;
  const normalized = input.toLowerCase();
  if (normalized === 'investor') return 'investor';
  if (normalized === 'wholesaler') return 'wholesaler';
  return null;
}

function isProTier(tier?: string | null): boolean {
  if (!tier) return false;
  const normalized = tier.toLowerCase();
  return normalized.includes('pro') || normalized.includes('enterprise');
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);

    if (!user) {
      return NextResponse.json<AnalyticsResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, segment, tier, membership_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load profile for analytics', profileError);
      return NextResponse.json<AnalyticsResponse>(
        { error: 'Unable to load analytics' },
        { status: 500 }
      );
    }

    const role =
      resolveRole(profile?.segment ?? null) ?? resolveRole(profile?.role ?? null);

    if (!role) {
      return NextResponse.json<AnalyticsResponse>(
        { error: 'User role is not configured' },
        { status: 400 }
      );
    }

    const stats = await getUserAnalytics(user.id, role);

    const isPro =
      isProTier(profile?.tier ?? null) || isProTier(profile?.membership_tier ?? null);

    return NextResponse.json<AnalyticsResponse>({ stats, isPro });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json<AnalyticsResponse>(
      { error: 'Analytics unavailable' },
      { status: 500 }
    );
  }
}


