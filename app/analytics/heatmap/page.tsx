import { getAuthUserServer, createSupabaseServerComponent } from '@/lib/auth/server';
import HeatmapClient from './HeatmapClient';

export const dynamic = 'force-dynamic';

type LocationInterest = {
  count: number;
  listings: { id: string; latitude: number | null; longitude: number | null; address: string | null; city: string | null; state: string | null; zip_code: string | null }[];
};

export default async function HeatmapPage() {
  const { user, error: authError } = await getAuthUserServer();

  if (authError || !user) {
    return null; // Layout will handle redirect
  }

  const supabase = createSupabaseServerComponent();

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', user.id)
    .single<{ role: string | null; segment: string | null }>();

  const role = (profile?.role || profile?.segment || 'investor').toLowerCase() as 'investor' | 'wholesaler';
  const isWholesaler = role === 'wholesaler';

  if (isWholesaler) {
    // Wholesaler view: Show where their buyers are engaging (cities/zips with most inquiries)
    const { data: listings } = await supabase
      .from('listings')
      .select('id, latitude, longitude, address, city, state, zip_code')
      .eq('owner_id', user.id)
      .returns<{ id: string; latitude: number | null; longitude: number | null; address: string | null; city: string | null; state: string | null; zip_code: string | null }[]>();

    const listingIds = (listings || []).map((l) => l.id).filter(Boolean);

    // Get messages and analyzer runs on their listings to see buyer interest
    const [messagesResult, analysisResult] = await Promise.all([
      listingIds.length > 0
        ? supabase
            .from('messages')
            .select('listing_id, from_id')
            .in('listing_id', listingIds.slice(0, 1000))
            .returns<{ listing_id: string; [key: string]: unknown }[]>()
        : { data: null, error: null },
      listingIds.length > 0
        ? supabase
            .from('ai_analysis_logs')
            .select('listing_id, user_id')
            .in('listing_id', listingIds.slice(0, 1000))
            .returns<{ listing_id: string; [key: string]: unknown }[]>()
        : { data: null, error: null },
    ]);

    const messages = messagesResult.data || [];
    const analyses = analysisResult.data || [];

    // Aggregate interest by location
    const locationInterest = new Map<string, LocationInterest>();
    (listings || []).forEach((listing) => {
      const key = `${listing.city || 'Unknown'}, ${listing.state || 'Unknown'}`;
      if (!locationInterest.has(key)) {
        locationInterest.set(key, { count: 0, listings: [] });
      }
      const data = locationInterest.get(key)!;
      data.count +=
        messages.filter((m) => m.listing_id === listing.id).length +
        analyses.filter((a) => a.listing_id === listing.id).length;
      data.listings.push(listing);
    });

    const points =
      (listings || [])
        .filter((l) => l.latitude != null && l.longitude != null)
        .map((l) => ({
          id: l.id,
          lat: l.latitude as number,
          lng: l.longitude as number,
          // Optional: add a title if you have address/city/state on the listing:
          // title: [l.address, l.city, l.state].filter(Boolean).join(", "),
        }));

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
          Geographic Heatmap
        </h2>
        <HeatmapClient points={points} />
      </div>
    );
  }

  // Investor view: Show where they're searching/saving (their watchlist locations)
  const { data: watchlists } = await supabase
    .from('watchlists')
    .select('property_id, listings(id, latitude, longitude, city, state, zip_code)')
    .eq('user_id', user.id)
    .limit(1000)
    .returns<
      {
        property_id: string;
        listings: {
          id: string;
          latitude: number | null;
          longitude: number | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
        }[] | null;
      }[]
    >();

  const watchlistListings = (watchlists || [])
    .flatMap((w) => (w.listings ? w.listings : []))
    .filter((l) => l && l.latitude != null && l.longitude != null) as Array<{
      id: string;
      latitude: number | null;
      longitude: number | null;
      city: string | null;
      state: string | null;
      zip_code: string | null;
    }>;

  const watchlistPoints =
    (watchlistListings || [])
      .filter((l) => l.latitude != null && l.longitude != null)
      .map((l) => ({
        id: l.id,
        lat: l.latitude as number,
        lng: l.longitude as number,
        // Optional: derive a label if you have it:
        // title: [l.city, l.state, l.zip_code].filter(Boolean).join(", "),
      }));

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
        Geographic Heatmap
      </h2>
      <HeatmapClient points={watchlistPoints} />
    </div>
  );
}
