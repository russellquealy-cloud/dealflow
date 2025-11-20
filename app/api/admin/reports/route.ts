import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reports
 * Generate admin reports (CSV format)
 * Body: { type: 'listings' | 'users' | 'financial' | 'market', format?: 'csv' | 'pdf' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const reportType = body.type as string;
    const format = (body.format || 'csv') as 'csv' | 'pdf';

    if (!reportType || !['listings', 'users', 'financial', 'market'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'pdf') {
      // PDF generation would require a library like pdfkit or puppeteer
      // For now, return error suggesting CSV
      return NextResponse.json(
        { error: 'PDF format not yet implemented. Please use CSV format.' },
        { status: 400 }
      );
    }

    let csv = '';
    let filename = '';

    if (reportType === 'listings') {
      // Property Listings Report
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id,
          address,
          city,
          state,
          zip_code,
          price,
          bedrooms,
          bathrooms,
          square_feet,
          lot_size,
          property_type,
          status,
          owner_id,
          created_at,
          updated_at,
          featured,
          owner:profiles!listings_owner_id_fkey(email, full_name, company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (listingsError) {
        console.error('Error fetching listings:', listingsError);
        return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
      }

      // Get message counts per listing
      const listingIds = (listings || []).map((l) => l.id).filter(Boolean);
      const { data: messages } = listingIds.length > 0
        ? await supabase
            .from('messages')
            .select('listing_id')
            .in('listing_id', listingIds.slice(0, 1000))
        : { data: null };

      const messageCounts = new Map<string, number>();
      (messages || []).forEach((m) => {
        if (m.listing_id) {
          messageCounts.set(m.listing_id, (messageCounts.get(m.listing_id) || 0) + 1);
        }
      });

      // Build CSV
      const csvRows: string[] = [];
      csvRows.push('ID,Address,City,State,ZIP,Price,Bedrooms,Bathrooms,Square Feet,Lot Size,Property Type,Status,Owner Email,Owner Name,Featured,Message Count,Created At,Updated At');

      (listings || []).forEach((listing) => {
        const owner = listing.owner as { email?: string; full_name?: string; company_name?: string } | null;
        csvRows.push(
          [
            listing.id,
            `"${(listing.address || '').replace(/"/g, '""')}"`,
            listing.city || '',
            listing.state || '',
            listing.zip_code || '',
            listing.price || '',
            listing.bedrooms || '',
            listing.bathrooms || '',
            listing.square_feet || '',
            listing.lot_size || '',
            listing.property_type || '',
            listing.status || 'active',
            owner?.email || '',
            owner?.full_name || owner?.company_name || '',
            listing.featured ? 'Yes' : 'No',
            messageCounts.get(listing.id) || 0,
            listing.created_at ? new Date(listing.created_at).toISOString().split('T')[0] : '',
            listing.updated_at ? new Date(listing.updated_at).toISOString().split('T')[0] : '',
          ].join(',')
        );
      });

      csv = csvRows.join('\n');
      filename = `property-listings-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (reportType === 'users') {
      // User Activity Report
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          company_name,
          role,
          segment,
          tier,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      // Get activity counts
      const userIds = (profiles || []).map((p) => p.id).filter(Boolean);
      
      const [listingsResult, messagesResult, watchlistsResult] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from('listings')
              .select('owner_id')
              .in('owner_id', userIds.slice(0, 1000))
          : { data: null },
        userIds.length > 0
          ? supabase
              .from('messages')
              .select('from_id')
              .in('from_id', userIds.slice(0, 1000))
          : { data: null },
        userIds.length > 0
          ? supabase
              .from('watchlists')
              .select('user_id')
              .in('user_id', userIds.slice(0, 1000))
          : { data: null },
      ]);

      const listingCounts = new Map<string, number>();
      (listingsResult.data || []).forEach((l: { owner_id: string }) => {
        listingCounts.set(l.owner_id, (listingCounts.get(l.owner_id) || 0) + 1);
      });

      const messageCounts = new Map<string, number>();
      (messagesResult.data || []).forEach((m: { from_id: string }) => {
        messageCounts.set(m.from_id, (messageCounts.get(m.from_id) || 0) + 1);
      });

      const watchlistCounts = new Map<string, number>();
      (watchlistsResult.data || []).forEach((w: { user_id: string }) => {
        watchlistCounts.set(w.user_id, (watchlistCounts.get(w.user_id) || 0) + 1);
      });

      // Build CSV
      const csvRows: string[] = [];
      csvRows.push('ID,Email,Name,Company,Role,Segment,Tier,Listings Created,Messages Sent,Watchlist Items,Account Created,Last Updated');

      (profiles || []).forEach((profile) => {
        csvRows.push(
          [
            profile.id,
            profile.email || '',
            profile.full_name || '',
            profile.company_name || '',
            profile.role || '',
            profile.segment || '',
            profile.tier || 'free',
            listingCounts.get(profile.id) || 0,
            messageCounts.get(profile.id) || 0,
            watchlistCounts.get(profile.id) || 0,
            profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : '',
            profile.updated_at ? new Date(profile.updated_at).toISOString().split('T')[0] : '',
          ].join(',')
        );
      });

      csv = csvRows.join('\n');
      filename = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (reportType === 'financial') {
      // Financial Report - subscription and revenue data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, tier, segment, created_at')
        .order('created_at', { ascending: false })
        .limit(10000);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
      }

      // Count by tier
      const tierCounts = new Map<string, number>();
      (profiles || []).forEach((p) => {
        const tier = p.tier || 'free';
        tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
      });

      // Build CSV
      const csvRows: string[] = [];
      csvRows.push('Tier,User Count,Monthly Revenue (Est),Yearly Revenue (Est)');
      
      const tierPricing: Record<string, { monthly: number; yearly: number }> = {
        free: { monthly: 0, yearly: 0 },
        basic: { monthly: 35, yearly: 385 },
        pro: { monthly: 60, yearly: 660 },
        enterprise: { monthly: 200, yearly: 2200 },
      };

      for (const [tier, count] of tierCounts.entries()) {
        const pricing = tierPricing[tier] || { monthly: 0, yearly: 0 };
        csvRows.push([
          tier,
          count.toString(),
          (count * pricing.monthly).toString(),
          (count * pricing.yearly).toString(),
        ].join(','));
      }

      csvRows.push(''); // Empty row
      csvRows.push('Total Users,' + Array.from(tierCounts.values()).reduce((a, b) => a + b, 0));
      csvRows.push('Total Monthly Revenue (Est),' + Array.from(tierCounts.entries())
        .reduce((sum, [tier, count]) => {
          const pricing = tierPricing[tier] || { monthly: 0, yearly: 0 };
          return sum + (count * pricing.monthly);
        }, 0));
      csvRows.push('Total Yearly Revenue (Est),' + Array.from(tierCounts.entries())
        .reduce((sum, [tier, count]) => {
          const pricing = tierPricing[tier] || { monthly: 0, yearly: 0 };
          return sum + (count * pricing.yearly);
        }, 0));

      csv = csvRows.join('\n');
      filename = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (reportType === 'market') {
      // Market Analysis Report
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, city, state, zip_code, price, bedrooms, bathrooms, square_feet, property_type, created_at')
        .not('price', 'is', null)
        .not('city', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (listingsError) {
        console.error('Error fetching listings:', listingsError);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
      }

      // Group by city/state
      const marketData = new Map<string, { count: number; totalPrice: number; avgPrice: number; listings: typeof listings }>();
      
      (listings || []).forEach((listing) => {
        const key = `${listing.city || 'Unknown'}, ${listing.state || 'Unknown'}`;
        if (!marketData.has(key)) {
          marketData.set(key, { count: 0, totalPrice: 0, avgPrice: 0, listings: [] });
        }
        const data = marketData.get(key)!;
        data.count++;
        data.totalPrice += listing.price || 0;
        data.listings.push(listing);
      });

      // Calculate averages
      marketData.forEach((data) => {
        data.avgPrice = data.count > 0 ? Math.round(data.totalPrice / data.count) : 0;
      });

      // Build CSV
      const csvRows: string[] = [];
      csvRows.push('City,State,Listing Count,Total Value,Average Price,Average Bedrooms,Average Bathrooms,Average Square Feet');

      for (const [location, data] of marketData.entries()) {
        const [city, state] = location.split(', ');
        const avgBedrooms = data.listings.reduce((sum, l) => sum + (l.bedrooms || 0), 0) / data.count;
        const avgBathrooms = data.listings.reduce((sum, l) => sum + (l.bathrooms || 0), 0) / data.count;
        const avgSqft = data.listings.reduce((sum, l) => sum + (l.square_feet || 0), 0) / data.count;

        csvRows.push([
          city,
          state,
          data.count.toString(),
          data.totalPrice.toString(),
          data.avgPrice.toString(),
          Math.round(avgBedrooms * 10) / 10,
          Math.round(avgBathrooms * 10) / 10,
          Math.round(avgSqft),
        ].join(','));
      }

      csv = csvRows.join('\n');
      filename = `market-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

