import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { sendViaSMTP } from '@/lib/email';
import { notifySavedSearchMatch } from '@/lib/notifications';

/**
 * Daily Deals Digest Email Cron Job
 * 
 * This endpoint should be called by Vercel Cron or Supabase Cron
 * Runs daily to send email alerts for active saved searches
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-digest",
 *     "schedule": "0 9 * * *" // 9 AM daily
 *   }]
 * }
 * 
 * Security: Should be protected by a secret token or Vercel Cron headers
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (set in Vercel environment variables)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also check Vercel Cron header
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    if (!vercelCronHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = await createSupabaseServer();

    // Get all active saved searches
    const { data: savedSearches, error: searchesError } = await supabase
      .from('saved_searches')
      .select('*, profiles!inner(email, id)')
      .eq('active', true);

    if (searchesError) {
      console.error('Error fetching saved searches:', searchesError);
      return NextResponse.json(
        { error: 'Failed to fetch saved searches' },
        { status: 500 }
      );
    }

    if (!savedSearches || savedSearches.length === 0) {
      return NextResponse.json({ message: 'No active saved searches', sent: 0 });
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Process each saved search
    for (const search of savedSearches) {
      try {
        const user = search.profiles as { email: string; id: string };
        if (!user.email) continue;

        // Build query based on saved search criteria
        let query = supabase
          .from('listings')
          .select('id, title, address, city, state, price, images, latitude, longitude, created_at')
          .eq('status', 'published')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        const criteria = search.criteria as Record<string, unknown>;

        // Apply filters from criteria
        if (criteria.minPrice) query = query.gte('price', criteria.minPrice as number);
        if (criteria.maxPrice) query = query.lte('price', criteria.maxPrice as number);
        if (criteria.minBeds) {
          query = query.or(`beds.gte.${criteria.minBeds},bedrooms.gte.${criteria.minBeds}`);
        }
        if (criteria.maxBeds) query = query.lte('bedrooms', criteria.maxBeds as number);
        if (criteria.minBaths) query = query.gte('baths', criteria.minBaths as number);
        if (criteria.maxBaths) query = query.lte('baths', criteria.maxBaths as number);
        if (criteria.minSqft) query = query.gte('sqft', criteria.minSqft as number);
        if (criteria.maxSqft) query = query.lte('sqft', criteria.maxSqft as number);
        if (criteria.propertyType) query = query.eq('property_type', criteria.propertyType as string);
        if (criteria.state) query = query.eq('state', criteria.state as string);
        if (criteria.city) query = query.ilike('city', `%${criteria.city}%`);

        // Apply polygon filter if present
        if (search.polygon_geojson) {
          const polygon = search.polygon_geojson as { type: string; coordinates: number[][][] };
          if (polygon.type === 'Polygon' && polygon.coordinates && polygon.coordinates[0]) {
            const coords = polygon.coordinates[0];
            const bounds = {
              minLng: Math.min(...coords.map(c => c[0])),
              maxLng: Math.max(...coords.map(c => c[0])),
              minLat: Math.min(...coords.map(c => c[1])),
              maxLat: Math.max(...coords.map(c => c[1])),
            };
            query = query
              .gte('latitude', bounds.minLat)
              .lte('latitude', bounds.maxLat)
              .gte('longitude', bounds.minLng)
              .lte('longitude', bounds.maxLng);
          }
        }

        // Only get listings from the last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gte('created_at', yesterday.toISOString());

        // Order by newest first
        query = query.order('created_at', { ascending: false }).limit(10);

        const { data: listings, error: listingsError } = await query;

        if (listingsError) {
          console.error(`Error fetching listings for search ${search.id}:`, listingsError);
          errors.push(`Search ${search.id}: ${listingsError.message}`);
          continue;
        }

        // Skip if no new listings
        if (!listings || listings.length === 0) {
          continue;
        }

        // Send in-app notification for market trend
        try {
          const firstListing = listings[0] as { id: string; title?: string };
          await notifySavedSearchMatch({
            userId: user.id,
            searchName: search.name || 'Your saved search',
            listingTitle: firstListing.title || null,
            listingId: firstListing.id,
            matchCount: listings.length,
            supabaseClient: supabase,
          });
        } catch (notificationError) {
          console.error(`Failed to send market trend notification for search ${search.id}:`, notificationError);
          // Continue with email even if notification fails
        }

        // Send email
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://offaxisdeals.com';
        const listingsHtml = listings.map((listing: {
          id: string;
          title?: string;
          address?: string;
          city?: string;
          state?: string;
          price?: number;
          images?: string[];
        }) => {
          const imageUrl = listing.images && listing.images[0] 
            ? `${siteUrl}/storage/v1/object/public/listings/${listing.images[0]}`
            : `${siteUrl}/placeholder-property.jpg`;
          
          return `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fff;">
              <div style="display: flex; gap: 16px;">
                <img src="${imageUrl}" alt="${listing.title || 'Property'}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px;" />
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a1a1a;">
                    <a href="${siteUrl}/listing/${listing.id}" style="color: #2563eb; text-decoration: none;">
                      ${listing.title || listing.address || 'Property'}
                    </a>
                  </h3>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                    ${listing.address || ''} ${listing.city || ''} ${listing.state || ''}
                  </p>
                  ${listing.price ? `<p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 600; color: #059669;">$${listing.price.toLocaleString()}</p>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 24px;">Daily Deals Digest</h1>
                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your saved search: "${search.name}"</p>
              </div>
              <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                  We found <strong>${listings.length}</strong> new ${listings.length === 1 ? 'listing' : 'listings'} matching your saved search criteria:
                </p>
                ${listingsHtml}
                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <a href="${siteUrl}/listings" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    View All Listings
                  </a>
                </div>
                <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                  You're receiving this because you have an active saved search. 
                  <a href="${siteUrl}/saved-searches" style="color: #3b82f6;">Manage your saved searches</a>
                </p>
              </div>
            </body>
          </html>
        `;

        await sendViaSMTP({
          to: user.email,
          subject: `Daily Deals Digest: ${listings.length} New ${listings.length === 1 ? 'Listing' : 'Listings'} Found`,
          html: emailHtml,
          text: `Daily Deals Digest\n\nYour saved search "${search.name}" found ${listings.length} new ${listings.length === 1 ? 'listing' : 'listings'}.\n\nView them at: ${siteUrl}/listings`,
        });

        sentCount++;
      } catch (error) {
        console.error(`Error processing search ${search.id}:`, error);
        errors.push(`Search ${search.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: savedSearches.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in daily-digest cron:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

