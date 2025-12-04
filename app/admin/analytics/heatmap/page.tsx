import HeatmapClient from '../../../analytics/heatmap/HeatmapClient';
import { requireAuthServer } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import type { AnyProfile } from "@/lib/profileCompleteness";

export const dynamic = 'force-dynamic';

/**
 * Admin-scoped Geographic Heatmap Page
 * 
 * This is an admin-only wrapper around the geographic heatmap analytics.
 * It performs server-side admin authentication and redirects non-admins.
 * 
 * Key differences from /analytics/heatmap:
 * - Uses server-side admin auth check (not client-side redirect guards)
 * - Reuses the same HeatmapClient component for consistency
 * - Renders under /admin layout with admin-specific messaging
 * - Does NOT trigger the "Already signed in, redirecting..." logic from login page
 * 
 * Access: /admin/analytics/heatmap
 */
export default async function AdminHeatmapPage() {
  // Admin auth check - redirect if not admin
  // Use consistent auth helper that prevents redirect loops
  const { user, supabase } = await requireAuthServer('/admin/analytics/heatmap');
  
  if (!user) {
    // requireAuthServer already handles redirect, but TypeScript needs this check
    return null;
  }

  // Get user profile and check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment, tier, membership_tier')
    .eq('id', user.id)
    .maybeSingle<AnyProfile>();

  // Check if user is admin
  const isAdmin =
    profile?.role === 'admin' ||
    profile?.segment === 'admin' ||
    profile?.tier === 'enterprise' ||
    profile?.membership_tier === 'enterprise' ||
    profile?.email === 'admin@offaxisdeals.com';

  if (!isAdmin) {
    redirect('/admin');
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <a href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </a>
      </div>
      
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
          Investor Interest Heatmap (Admin View)
        </h2>
        <p
          style={{
            margin: "0 0 16px 0",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Geographic visualization of investor interest across all listings. As an admin, you can see aggregated interest patterns across the entire platform.
        </p>
        <HeatmapClient />
      </div>
    </div>
  );
}

