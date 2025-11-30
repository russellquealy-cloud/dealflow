/**
 * Admin-only route to backfill missing latitude/longitude for existing listings
 * 
 * Usage: Call this endpoint once as an admin to geocode all listings with null coordinates
 * After running, you can comment out or lock down this route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { geocodeAddress } from '@/lib/geocoding';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (for bulk operations)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userIsAdmin = isAdmin(user.email || user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all listings with null coordinates
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, address, city, state, zip, latitude, longitude')
      .or('latitude.is.null,longitude.is.null');

    if (fetchError) {
      console.error('Error fetching listings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        message: 'No listings found with missing coordinates',
        updated: 0,
        failed: 0,
      });
    }

    console.log(`🔄 Starting geocoding backfill for ${listings.length} listings...`);

    let updated = 0;
    let failed = 0;
    const errors: Array<{ id: string; address: string; error: string }> = [];

    // Process listings one by one (with rate limiting consideration)
    for (const listing of listings) {
      const addressParts = [
        listing.address,
        listing.city,
        listing.state,
        listing.zip,
      ].filter(Boolean) as string[];

      if (addressParts.length === 0) {
        console.warn(`⚠️ Skipping listing ${listing.id}: no address components`);
        failed++;
        errors.push({
          id: listing.id,
          address: 'No address',
          error: 'Missing address components',
        });
        continue;
      }

      const fullAddress = addressParts.join(', ');

      try {
        const coordinates = await geocodeAddress(fullAddress);

        if (!coordinates) {
          console.warn(`⚠️ Failed to geocode listing ${listing.id}: ${fullAddress}`);
          failed++;
          errors.push({
            id: listing.id,
            address: fullAddress,
            error: 'Geocoding returned null',
          });
          continue;
        }

        // Update listing with coordinates
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          })
          .eq('id', listing.id);

        if (updateError) {
          console.error(`❌ Failed to update listing ${listing.id}:`, updateError);
          failed++;
          errors.push({
            id: listing.id,
            address: fullAddress,
            error: updateError.message,
          });
        } else {
          updated++;
          console.log(`✅ Updated listing ${listing.id}: ${fullAddress} -> (${coordinates.lat}, ${coordinates.lng})`);
        }

        // Small delay to respect API rate limits (optional, but recommended)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error processing listing ${listing.id}:`, error);
        failed++;
        errors.push({
          id: listing.id,
          address: fullAddress,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(`✅ Geocoding backfill complete: ${updated} updated, ${failed} failed`);

    return NextResponse.json({
      message: 'Geocoding backfill completed',
      total: listings.length,
      updated,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in backfill-geo POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

