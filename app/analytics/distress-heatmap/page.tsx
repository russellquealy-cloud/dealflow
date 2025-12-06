import { redirect } from 'next/navigation';
import { getAuthUserServer } from '@/lib/auth/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import DistressHeatmapClient from './DistressHeatmapClient';
import { isPro } from '@/lib/analytics/proGate';

export const dynamic = 'force-dynamic';

/**
 * Distressed Area Heatmap page with Pro tier gating
 * 
 * Access rules:
 * - Not signed in -> redirect to login (handled by layout)
 * - Signed in but not investor/wholesaler -> redirect to dashboard (no loop)
 * - Signed in as investor/wholesaler Free -> show upgrade prompt (no redirect loop)
 * - Signed in as Investor Pro or Wholesaler Pro -> allow access
 * - Admin -> always allow access
 */
export default async function DistressHeatmapPage() {
  // Layout already checks auth, but verify user here for consistency
  const { user, supabase, error: authError } = await getAuthUserServer();
  
  if (!user || authError) {
    return null; // Layout will handle redirect
  }

  // Fetch user profile to check tier and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment, tier, membership_tier')
    .eq('id', user.id)
    .maybeSingle<{ role: string | null; segment: string | null; tier: string | null; membership_tier: string | null }>();

  // Check if user is admin - admins always have access
  const isAdmin =
    profile?.role === 'admin' ||
    profile?.segment === 'admin' ||
    profile?.tier === 'enterprise' ||
    profile?.membership_tier === 'enterprise';

  if (!isAdmin) {
    // Check if user is investor or wholesaler
    const role = (profile?.role || profile?.segment || '').toLowerCase();
    const isInvestor = role === 'investor';
    const isWholesaler = role === 'wholesaler';

    if (!isInvestor && !isWholesaler) {
      // Not investor or wholesaler -> redirect to dashboard (safe default, no loop)
      redirect('/dashboard');
    }

    // Check if user has Pro tier
    const tier = profile?.tier || profile?.membership_tier || 'free';
    const hasProAccess = isPro(tier);

    if (!hasProAccess) {
      // Free tier -> show upgrade prompt (no redirect loop)
      return (
        <div
          style={{
            padding: "24px",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px 0",
              fontSize: "24px",
              fontWeight: 600,
            }}
          >
            Advanced Analytics - Pro Required
          </h2>
          <p
            style={{
              margin: "0 0 24px 0",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Distressed area heatmaps are available for {isInvestor ? 'Investor' : 'Wholesaler'} Pro subscribers.
          </p>
          <a
            href={`/pricing?segment=${isInvestor ? 'investor' : 'wholesaler'}&tier=pro`}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Upgrade to Pro
          </a>
        </div>
      );
    }
  }

  // User has Pro access or is admin - show distress heatmap
  return (
    <div
      style={{
        padding: "24px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          margin: "0 0 24px 0",
          fontSize: "24px",
          fontWeight: 600,
        }}
      >
        Distressed Area Heatmap
      </h2>
      <p
        style={{
          margin: "0 0 16px 0",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        This heatmap shows distressed areas based on imported property data (price cuts, days on market, 
        foreclosure indicators, etc.). Higher distress scores indicate areas with more distressed properties.
      </p>
      <DistressHeatmapClient />
    </div>
  );
}
