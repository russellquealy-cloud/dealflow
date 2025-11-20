import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { isAdmin } from '@/lib/admin';
import { isPro } from '@/lib/analytics/proGate';

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (admins bypass Pro requirement)
    const userIsAdmin = await isAdmin(user.id, supabase);

    // Check if user is Pro (Investor or Wholesaler) - admins bypass this check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, segment, tier, membership_tier')
      .eq('id', user.id)
      .single();

    if (!userIsAdmin && !isPro(profile)) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const role = (profile?.role || profile?.segment || 'investor').toLowerCase() as 'investor' | 'wholesaler';
    const isWholesaler = role === 'wholesaler';

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const range = searchParams.get('range') || '30';

    if (type !== 'deals' && type !== 'analytics') {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date | null = null;
    if (range !== 'all') {
      const days = parseInt(range, 10);
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    if (type === 'deals') {
      if (isWholesaler) {
        // Wholesaler export: their listings and leads
        const { data: listings } = await supabase
          .from('listings')
          .select('id, address, city, state, zip_code, price, bedrooms, bathrooms, square_feet, status, created_at')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        // Get messages on their listings
        const listingIds = (listings || []).map((l) => l.id).filter(Boolean);
        const { data: messages } = listingIds.length > 0
          ? await supabase
              .from('messages')
              .select('listing_id, from_id, created_at, body')
              .in('listing_id', listingIds.slice(0, 1000))
              .order('created_at', { ascending: false })
          : { data: null };

        // Filter by date range
        const filteredListings = startDate
          ? (listings || []).filter((l) => new Date(l.created_at || '').getTime() >= startDate!.getTime())
          : listings || [];
        const filteredMessages = startDate
          ? (messages || []).filter((m) => new Date(m.created_at).getTime() >= startDate!.getTime())
          : messages || [];

        // Build CSV
        const csvRows: string[] = [];
        csvRows.push('Listing ID,Address,City,State,ZIP,Price,Bedrooms,Bathrooms,Square Feet,Status,Leads Count,First Lead Date');

        const messageCounts = new Map<string, number>();
        const firstLeadDate = new Map<string, string>();

        filteredMessages.forEach((m) => {
          if (m.listing_id) {
            messageCounts.set(m.listing_id, (messageCounts.get(m.listing_id) || 0) + 1);
            const date = new Date(m.created_at).toISOString().split('T')[0];
            const existing = firstLeadDate.get(m.listing_id);
            if (!existing || date < existing) {
              firstLeadDate.set(m.listing_id, date);
            }
          }
        });

        filteredListings.forEach((listing) => {
          const leadsCount = messageCounts.get(listing.id) || 0;
          const firstLead = firstLeadDate.get(listing.id) || '';

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
              listing.status || 'active',
              leadsCount,
              firstLead,
            ].join(',')
          );
        });

        const csv = csvRows.join('\n');
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="off-axis-listings-${range}days-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }

      // Investor export: deals and interactions
      const [watchlistsResult, messagesResult] = await Promise.all([
        supabase
          .from('watchlists')
          .select('property_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select('listing_id, created_at, body')
          .eq('from_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const watchlists = watchlistsResult.data || [];
      const messages = messagesResult.data || [];

      // Filter by date range if specified
      const filteredWatchlists = startDate
        ? watchlists.filter((w) => new Date(w.created_at) >= startDate!)
        : watchlists;
      const filteredMessages = startDate
        ? messages.filter((m) => new Date(m.created_at) >= startDate!)
        : messages;

      // Get listing details
      const listingIds = new Set([
        ...filteredWatchlists.map((w) => w.property_id).filter(Boolean),
        ...filteredMessages.map((m) => m.listing_id).filter((id): id is string => Boolean(id)),
      ]);

      const { data: listings } = await supabase
        .from('listings')
        .select('id, address, city, state, zip_code, price, bedrooms, bathrooms, square_feet')
        .in('id', Array.from(listingIds).slice(0, 1000));

      // Build CSV
      const csvRows: string[] = [];
      csvRows.push('Listing ID,Address,City,State,ZIP,Price,Bedrooms,Bathrooms,Square Feet,Watchlisted,Message Count,First Interaction Date');
      
      const listingMap = new Map((listings || []).map((l) => [l.id, l]));
      const messageCounts = new Map<string, number>();
      const firstInteraction = new Map<string, string>();

      filteredMessages.forEach((m) => {
        if (m.listing_id) {
          messageCounts.set(m.listing_id, (messageCounts.get(m.listing_id) || 0) + 1);
          const date = new Date(m.created_at).toISOString().split('T')[0];
          const existing = firstInteraction.get(m.listing_id);
          if (!existing || date < existing) {
            firstInteraction.set(m.listing_id, date);
          }
        }
      });

      filteredWatchlists.forEach((w) => {
        if (w.property_id) {
          const date = new Date(w.created_at).toISOString().split('T')[0];
          const existing = firstInteraction.get(w.property_id);
          if (!existing || date < existing) {
            firstInteraction.set(w.property_id, date);
          }
        }
      });

      listingMap.forEach((listing) => {
        const watchlisted = filteredWatchlists.some((w) => w.property_id === listing.id);
        const messageCount = messageCounts.get(listing.id) || 0;
        const interactionDate = firstInteraction.get(listing.id) || '';

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
            watchlisted ? 'Yes' : 'No',
            messageCount,
            interactionDate,
          ].join(',')
        );
      });

      const csv = csvRows.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="off-axis-deals-${range}days-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Export analytics summary
      // TODO: Implement full analytics export once PropStream data is available
      const csvRows: string[] = [];
      csvRows.push('Metric,Value,Date Range');
      csvRows.push(`Total Listings Engaged,0,${range === 'all' ? 'All Time' : `Last ${range} Days`}`);
      csvRows.push('Conversations Started,0,');
      csvRows.push('Closed Deals,0,');
      csvRows.push('Average Response Time,0,');
      csvRows.push('Conversion Rate,0%,');

      const csv = csvRows.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="off-axis-analytics-${range}days-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

