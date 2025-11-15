import { createSupabaseServer } from '@/lib/createSupabaseServer';
import HeatmapClient from './HeatmapClient';

export default async function HeatmapPage() {
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
    // Wholesaler view: Show where their buyers are engaging (cities/zips with most inquiries)
    const { data: listings } = await supabase
      .from('listings')
      .select('id, latitude, longitude, address, city, state, zip_code')
      .eq('owner_id', user.id);

    const listingIds = (listings || []).map((l) => l.id).filter(Boolean);

    // Get messages and analyzer runs on their listings to see buyer interest
    const [messagesResult, analysisResult] = await Promise.all([
      listingIds.length > 0
        ? supabase
            .from('messages')
            .select('listing_id, from_id')
            .in('listing_id', listingIds.slice(0, 1000))
        : { data: null, error: null },
      listingIds.length > 0
        ? supabase
            .from('ai_analysis_logs')
            .select('listing_id, user_id')
            .in('listing_id', listingIds.slice(0, 1000))
        : { data: null, error: null },
    ]);

    const messages = messagesResult.data || [];
    const analyses = analysisResult.data || [];

    // Count interest by listing location
    const cityInterest: Record<string, number> = {};
    const zipInterest: Record<string, number> = {};

    if (listings) {
      listings.forEach((listing) => {
        const messageCount = messages.filter((m) => m.listing_id === listing.id).length;
        const analysisCount = analyses.filter((a) => a.listing_id === listing.id).length;
        const interestScore = messageCount + analysisCount;

        if (interestScore > 0) {
          if (listing.city && listing.state) {
            const cityKey = `${listing.city}, ${listing.state}`;
            cityInterest[cityKey] = (cityInterest[cityKey] || 0) + interestScore;
          }
          if (listing.zip_code) {
            zipInterest[listing.zip_code] = (zipInterest[listing.zip_code] || 0) + interestScore;
          }
        }
      });
    }

    // Build map points from listings with interest
    const points: Array<{ id: string; lat: number; lng: number; title?: string }> = [];
    if (listings) {
      listings.forEach((listing) => {
        if (listing.latitude && listing.longitude) {
          points.push({
            id: listing.id,
            lat: listing.latitude,
            lng: listing.longitude,
            title: listing.address || undefined,
          });
        }
      });
    }

    const hasData = points.length > 0 || Object.keys(cityInterest).length > 0;

    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
          Geographic Heatmap
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No geographic data yet
            </p>
            <p style={{ margin: 0, fontSize: 14 }}>
              Post listings and receive inquiries to see where your buyers are engaging.
            </p>
          </div>
        ) : (
          <>
            {/* Top Cities by Interest */}
            {Object.keys(cityInterest).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                  Top Cities by Buyer Interest
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 12,
                  }}
                >
                  {Object.entries(cityInterest)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 12)
                    .map(([city, score]) => (
                      <div
                        key={city}
                        style={{
                          padding: '12px 16px',
                          background: '#f8fafc',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                          {city}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
                          {score} {score === 1 ? 'inquiry' : 'inquiries'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top ZIP Codes */}
            {Object.keys(zipInterest).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                  Top ZIP Codes by Interest
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {Object.entries(zipInterest)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 20)
                    .map(([zip, score]) => (
                      <div
                        key={zip}
                        style={{
                          padding: '8px 12px',
                          background: '#eff6ff',
                          borderRadius: 6,
                          border: '1px solid #bfdbfe',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#1e40af',
                        }}
                      >
                        {zip}: {score}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Map */}
            {points.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                  Your Listings Map
                </h3>
                <div style={{ height: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <HeatmapClient points={points} />
                </div>
                <p style={{ margin: '12px 0 0 0', fontSize: 13, color: '#64748b' }}>
                  Showing {points.length} {points.length === 1 ? 'listing' : 'listings'} you&apos;ve posted
                </p>
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
  
  // Get unique listing IDs
  const listingIds = new Set([
    ...watchlists.map((w) => w.property_id).filter(Boolean),
    ...messages.map((m) => m.listing_id).filter((id): id is string => Boolean(id)),
  ]);

  // Fetch listing details with coordinates
  const points: Array<{ id: string; lat: number; lng: number; title?: string }> = [];
  const cityStats: Record<string, number> = {};
  const zipStats: Record<string, number> = {};

  if (listingIds.size > 0) {
    const { data: listings } = await supabase
      .from('listings')
      .select('id, latitude, longitude, address, city, state, zip_code, price')
      .in('id', Array.from(listingIds).slice(0, 200)); // Limit for performance

    if (listings) {
      listings.forEach((listing) => {
        if (listing.latitude && listing.longitude) {
          points.push({
            id: listing.id,
            lat: listing.latitude,
            lng: listing.longitude,
            title: listing.address || undefined,
          });

          // Aggregate by city
          if (listing.city && listing.state) {
            const cityKey = `${listing.city}, ${listing.state}`;
            cityStats[cityKey] = (cityStats[cityKey] || 0) + 1;
          }

          // Aggregate by ZIP
          if (listing.zip_code) {
            zipStats[listing.zip_code] = (zipStats[listing.zip_code] || 0) + 1;
          }
        }
      });
    }
  }

  const hasData = points.length > 0;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
        Geographic Heatmap
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            No geographic data yet
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Start saving deals and messaging wholesalers to see your interest heatmap.
          </p>
        </div>
      ) : (
        <>
          {/* Top Cities */}
          {Object.keys(cityStats).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                Top Cities by Interest
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {Object.entries(cityStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 12)
                  .map(([city, count]) => (
                    <div
                      key={city}
                      style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                        {city}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
                        {count} {count === 1 ? 'deal' : 'deals'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top ZIP Codes */}
          {Object.keys(zipStats).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                Top ZIP Codes
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {Object.entries(zipStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 20)
                  .map(([zip, count]) => (
                    <div
                      key={zip}
                      style={{
                        padding: '8px 12px',
                        background: '#eff6ff',
                        borderRadius: 6,
                        border: '1px solid #bfdbfe',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#1e40af',
                      }}
                    >
                      {zip}: {count}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
              Interest Map
            </h3>
            <div style={{ height: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <HeatmapClient points={points} />
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: 13, color: '#64748b' }}>
              Showing {points.length} {points.length === 1 ? 'property' : 'properties'} you&apos;ve engaged with
            </p>
          </div>
        </>
      )}
    </div>
  );
}

