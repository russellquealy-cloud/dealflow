import { getAuthUserServer } from '@/lib/auth/server';
import type { AnyProfile } from "@/lib/profileCompleteness";

export const dynamic = 'force-dynamic';

export default async function LeadConversionPage() {
  // Use consistent auth helper - layout already checked auth, but we need supabase client
  // If auth fails here, it's likely a race condition - layout will handle redirect
  const { user, supabase, error: authError } = await getAuthUserServer();

  // If no user, return null - layout already handles redirect
  if (authError || !user) {
    return null;
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', user.id)
    .single<AnyProfile>();

  const role = (profile?.role || profile?.segment || 'investor').toLowerCase() as 'investor' | 'wholesaler';
  const isWholesaler = role === 'wholesaler';

  if (isWholesaler) {
    // Wholesaler view: Funnel from listing views → contacts → under contract → sold
    const { data: listings } = await supabase
      .from('listings')
      .select('id, city, state, status')
      .eq('owner_id', user.id)
      .returns<
        {
          id: string;
          status: string | null;
          owner_id?: string;
          [key: string]: unknown;
        }[]
      >();

    // Defensive calculations to prevent NaN/undefined
    const totalListings = Number(listings?.length || 0);
    const soldListings = Number(listings?.filter((l) => {
      const status = (l.status || '').toLowerCase();
      return status === 'sold' || status === 'closed';
    }).length || 0);

    // Get contacts received (distinct investors who messaged about their listings)
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
      <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600 }}>Lead Conversion Trends</h2>
        
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

        <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            <strong>Note:</strong> This is a simplified view. Full conversion tracking with detailed analytics is coming soon.
          </p>
        </div>
      </div>
    );
  }

  // Investor view: Funnel from searches → saved → contacted → under contract → closed
  const { data: watchlists } = await supabase
    .from('watchlists')
    .select('property_id')
    .eq('user_id', user.id);

  // Defensive calculations to prevent NaN/undefined
  const savedCount = Number(watchlists?.length || 0);

  const { data: messages } = await supabase
    .from('messages')
    .select('from_id, listing_id')
    .eq('from_id', user.id)
    .returns<
      {
        from_id: string | null;
        listing_id: string | null;
        [key: string]: unknown;
      }[]
    >();

  const contactedCount = Number(new Set((messages || []).map((m) => m.listing_id).filter(Boolean)).size || 0);
  
  // Calculate conversion rate (saved → contacted)
  let savedToContactRate: string | null = null;
  if (savedCount > 0 && contactedCount >= 0) {
    const rate = (contactedCount / savedCount) * 100;
    savedToContactRate = Number.isFinite(rate) ? rate.toFixed(1) : '0.0';
  } else {
    savedToContactRate = 'N/A';
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600 }}>Lead Conversion Trends</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>—</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Searches</div>
        </div>
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b82f6' }}>{savedCount}</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Saved Properties</div>
        </div>
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{contactedCount}</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Contacted</div>
        </div>
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#8b5cf6' }}>—</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Under Contract</div>
        </div>
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
            {savedToContactRate === 'N/A' ? 'N/A' : `${savedToContactRate}%`}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Saved → Contact Rate</div>
        </div>
      </div>

      <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
        <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
          <strong>Note:</strong> This is a simplified view. Full conversion tracking with detailed analytics is coming soon.
        </p>
      </div>
    </div>
  );
}
