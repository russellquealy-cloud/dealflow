import { createServerClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import type { AnyProfile } from "@/lib/profileCompleteness";

export const dynamic = 'force-dynamic';

/**
 * Admin-scoped Lead Conversion Trends Page
 * 
 * This is an admin-only wrapper around the lead conversion analytics.
 * It performs server-side admin authentication and redirects non-admins.
 * 
 * Key differences from /analytics/lead-conversion:
 * - Uses server-side admin auth check (not client-side redirect guards)
 * - Shows aggregate data across all listings (admin view)
 * - Renders under /admin layout, not /analytics layout
 * - Does NOT trigger the "Already signed in, redirecting..." logic from login page
 * 
 * Access: /admin/analytics/lead-conversion
 */
export default async function AdminLeadConversionPage() {
  // Admin auth check - redirect if not admin
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?next=/admin/analytics/lead-conversion');
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

  // For admin view, we show aggregated data across all listings in the system

  // Get all listings (admin can see everything)
  const { data: listings } = await supabase
    .from('listings')
    .select('id, city, state, status')
    .returns<
      {
        id: string;
        status: string | null;
        owner_id?: string;
        [key: string]: unknown;
      }[]
    >();

  const totalListings = Number(listings?.length || 0);
  const soldListings = Number(listings?.filter((l) => {
    const status = (l.status || '').toLowerCase();
    return status === 'sold' || status === 'closed';
  }).length || 0);

  // Get contacts received (distinct investors who messaged about listings)
  const listingIds = (listings || []).map((l) => l.id).filter(Boolean);
  let contactsReceived = 0;
  if (listingIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('from_id, listing_id')
      .in('listing_id', listingIds.slice(0, 1000))
      .returns<
        {
          from_id: string | null;
          listing_id: string | null;
          [key: string]: unknown;
        }[]
      >();
    
    contactsReceived = Number(new Set(
      (messages || []).map((m) => m.from_id).filter(Boolean)
    ).size || 0);
  }

  // Calculate conversion rate with defensive checks
  let conversionRate: string | null = null;
  if (totalListings > 0 && soldListings >= 0) {
    const rate = (soldListings / totalListings) * 100;
    conversionRate = Number.isFinite(rate) ? rate.toFixed(1) : '0.0';
  } else {
    conversionRate = 'N/A';
  }

  // Calculate contact rate with defensive checks
  let contactRate: string | null = null;
  if (totalListings > 0 && contactsReceived >= 0) {
    const rate = (contactsReceived / totalListings) * 100;
    contactRate = Number.isFinite(rate) ? rate.toFixed(1) : '0.0';
  } else {
    contactRate = 'N/A';
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <a href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </a>
      </div>
      
      <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600 }}>Lead Conversion Trends (Admin View)</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>{totalListings}</div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Total Listings</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b82f6' }}>{contactsReceived}</div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Contacts Received</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{soldListings}</div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Sold Listings</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#8b5cf6' }}>
              {conversionRate === 'N/A' ? 'N/A' : `${conversionRate}%`}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Conversion Rate</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
              {contactRate === 'N/A' ? 'N/A' : `${contactRate}%`}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Contact Rate</div>
          </div>
        </div>

        <div style={{ padding: '16px', background: '#e0f2fe', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
            <strong>Admin View:</strong> This shows aggregate metrics across all listings in the system. For detailed conversion tracking with time-series data, additional analytics features are coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

