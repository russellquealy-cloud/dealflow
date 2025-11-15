import { createSupabaseServer } from '@/lib/createSupabaseServer';

export default async function LeadConversionPage() {
  const supabase = await createSupabaseServer();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Layout will handle redirect
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', user.id)
    .single();

  const role = (profile?.role || profile?.segment || 'investor').toLowerCase() as 'investor' | 'wholesaler';
  const isWholesaler = role === 'wholesaler';

  if (isWholesaler) {
    // Wholesaler view: Funnel from listing views → contacts → under contract → sold
    const { data: listings } = await supabase
      .from('listings')
      .select('id, city, state, status')
      .eq('owner_id', user.id);

    const totalListings = listings?.length || 0;
    const soldListings = listings?.filter((l) => {
      const status = (l.status || '').toLowerCase();
      return status === 'sold' || status === 'closed';
    }).length || 0;

    // Get contacts received (distinct investors who messaged about their listings)
    const listingIds = (listings || []).map((l) => l.id).filter(Boolean);
    let contactsReceived = 0;
    if (listingIds.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('from_id, listing_id')
        .in('listing_id', listingIds.slice(0, 1000));
      
      contactsReceived = new Set(
        (messages || []).map((m) => m.from_id).filter(Boolean)
      ).size;
    }

    // TODO: Get listing views once we have view tracking
    const listingViews = 0; // Placeholder

    // Market breakdown
    const marketBreakdown: Record<string, number> = {};
    if (listings) {
      listings.forEach((listing) => {
        const market = listing.city && listing.state 
          ? `${listing.city}, ${listing.state}`
          : listing.city || listing.state || 'Unknown';
        marketBreakdown[market] = (marketBreakdown[market] || 0) + 1;
      });
    }

    const hasData = totalListings > 0 || contactsReceived > 0;

    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
          Lead Conversion Trends
        </h2>

        {!hasData ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              color: '#64748b',
              background: '#f8fafc',
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No conversion data yet
            </p>
            <p style={{ margin: 0, fontSize: 14 }}>
              Once you post listings and receive inquiries, your conversion trends will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Funnel Summary */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                Conversion Funnel
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <FunnelStep
                  label="Listing Views"
                  value={listingViews}
                  color="#3b82f6"
                  description={listingViews > 0 ? 'Total views on your listings' : 'Coming soon: View tracking will be available soon'}
                />
                <FunnelStep
                  label="Contacts Received"
                  value={contactsReceived}
                  color="#0ea5e9"
                  description="Distinct investors who contacted you about your listings"
                />
                <FunnelStep
                  label="Under Contract / Sold"
                  value={soldListings}
                  color={soldListings > 0 ? '#22c55e' : '#94a3b8'}
                  description={
                    soldListings > 0
                      ? 'Listings marked as sold or closed'
                      : 'Coming soon: This will be powered by post-closing feedback and PropStream data'
                  }
                />
              </div>
            </div>

            {/* Market Breakdown */}
            {Object.keys(marketBreakdown).length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                  Listings by Market
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {Object.entries(marketBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([market, count]) => (
                      <div
                        key={market}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: '#f8fafc',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                          {market}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>
                          {count} {count === 1 ? 'listing' : 'listings'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Investor view (existing implementation)
  const [watchlistsResult, messagesResult] = await Promise.all([
    supabase
      .from('watchlists')
      .select('property_id, created_at')
      .eq('user_id', user.id),
    supabase
      .from('messages')
      .select('listing_id, created_at')
      .eq('from_id', user.id),
  ]);

  const watchlists = watchlistsResult.data || [];
  const messages = messagesResult.data || [];
  
  // Count unique listings engaged with
  const engagedListingIds = new Set([
    ...watchlists.map((w) => w.property_id),
    ...messages.map((m) => m.listing_id).filter((id): id is string => Boolean(id)),
  ]);

  const listingsEngaged = engagedListingIds.size;
  const conversationsStarted = new Set(messages.map((m) => m.listing_id).filter(Boolean)).size;
  
  // TODO: Add closed/won deals tracking once PropStream integration is available
  // For now, check if there's a status field or separate table
  const closedDeals = 0; // Placeholder

  // Get market breakdown if location data is available
  const marketBreakdown: Record<string, number> = {};
  
  if (watchlists.length > 0) {
    const listingIds = watchlists.map((w) => w.property_id).filter(Boolean);
    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from('listings')
        .select('id, city, state')
        .in('id', listingIds.slice(0, 100)); // Limit to avoid query size issues
      
      if (listings) {
        listings.forEach((listing) => {
          const market = listing.city && listing.state 
            ? `${listing.city}, ${listing.state}`
            : listing.city || listing.state || 'Unknown';
          marketBreakdown[market] = (marketBreakdown[market] || 0) + 1;
        });
      }
    }
  }

  const hasData = listingsEngaged > 0 || conversationsStarted > 0;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
        Lead Conversion Trends
      </h2>

      {!hasData ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            color: '#64748b',
            background: '#f8fafc',
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            No conversion data yet
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Once you start saving deals and messaging wholesalers, your conversion trends will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Funnel Summary */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
              Conversion Funnel
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <FunnelStep
                label="Listings Engaged"
                value={listingsEngaged}
                color="#3b82f6"
                description="Properties you've saved, messaged about, or analyzed"
              />
              <FunnelStep
                label="Conversations Started"
                value={conversationsStarted}
                color="#0ea5e9"
                description="Deals where you initiated contact"
              />
              <FunnelStep
                label="Marked Closed / Completed"
                value={closedDeals}
                color={closedDeals > 0 ? '#22c55e' : '#94a3b8'}
                description={
                  closedDeals > 0
                    ? 'Deals you marked as closed'
                    : 'Coming soon: This will be powered by post-closing feedback and PropStream data'
                }
              />
            </div>
          </div>

          {/* Market Breakdown */}
          {Object.keys(marketBreakdown).length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                Activity by Market
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {Object.entries(marketBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([market, count]) => (
                    <div
                      key={market}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                        {market}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>
                        {count} {count === 1 ? 'interaction' : 'interactions'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: number;
  color: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        background: '#f8fafc',
        borderRadius: 12,
        border: `2px solid ${color}33`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 32, fontWeight: 700, color }}>
          {value.toLocaleString()}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
        {description}
      </p>
    </div>
  );
}

