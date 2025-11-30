import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { geocodeAddress } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/listings/[id]
 * Update an existing listing with automatic geocoding if address changed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify listing exists and belongs to user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('id, owner_id, address, city, state, zip, latitude, longitude')
      .eq('id', id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (existingListing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      address,
      city,
      state,
      zip,
      title,
      price,
      arv,
      repairs,
      beds,
      baths,
      sqft,
      lot_sqft,
      garage_spaces,
      year_built,
      description,
      property_type,
      age_restricted,
      // Support legacy fields during transition, but convert to canonical
      bedrooms,
      bathrooms,
      home_sqft,
      lot_size,
      garage,
    } = body;

    // Build update payload with canonical fields only
    const updatePayload: Record<string, unknown> = {};

    // Text fields
    if (title !== undefined) updatePayload.title = title?.trim() || null;
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (property_type !== undefined) updatePayload.property_type = property_type || null;
    if (age_restricted !== undefined) updatePayload.age_restricted = age_restricted || false;

    // Numeric fields - use canonical, but accept legacy during transition
    if (price !== undefined) {
      updatePayload.price = typeof price === 'number' ? price : typeof price === 'string' ? parseFloat(price) || 0 : 0;
    }
    if (arv !== undefined) {
      updatePayload.arv = typeof arv === 'number' ? arv : typeof arv === 'string' ? parseFloat(arv) || null : null;
    }
    if (repairs !== undefined) {
      updatePayload.repairs = typeof repairs === 'number' ? repairs : typeof repairs === 'string' ? parseFloat(repairs) || null : null;
    }
    if (beds !== undefined) {
      updatePayload.beds = typeof beds === 'number' ? beds : typeof beds === 'string' ? parseInt(beds, 10) || null : null;
    } else if (bedrooms !== undefined) {
      // Support legacy field during transition
      updatePayload.beds = typeof bedrooms === 'number' ? bedrooms : typeof bedrooms === 'string' ? parseInt(bedrooms, 10) || null : null;
    }
    if (baths !== undefined) {
      updatePayload.baths = typeof baths === 'number' ? baths : typeof baths === 'string' ? parseInt(baths, 10) || null : null;
    } else if (bathrooms !== undefined) {
      // Support legacy field during transition
      updatePayload.baths = typeof bathrooms === 'number' ? bathrooms : typeof bathrooms === 'string' ? parseInt(bathrooms, 10) || null : null;
    }
    if (sqft !== undefined) {
      updatePayload.sqft = typeof sqft === 'number' ? sqft : typeof sqft === 'string' ? parseInt(sqft, 10) || null : null;
    } else if (home_sqft !== undefined) {
      // Support legacy field during transition
      updatePayload.sqft = typeof home_sqft === 'number' ? home_sqft : typeof home_sqft === 'string' ? parseInt(home_sqft, 10) || null : null;
    }
    if (lot_sqft !== undefined) {
      updatePayload.lot_sqft = typeof lot_sqft === 'number' ? lot_sqft : typeof lot_sqft === 'string' ? parseFloat(lot_sqft) || null : null;
    } else if (lot_size !== undefined) {
      // Support legacy field during transition (assume sqft if no unit specified)
      updatePayload.lot_sqft = typeof lot_size === 'number' ? lot_size : typeof lot_size === 'string' ? parseFloat(lot_size) || null : null;
    }
    if (garage_spaces !== undefined) {
      updatePayload.garage_spaces = typeof garage_spaces === 'number' ? garage_spaces : typeof garage_spaces === 'string' ? parseInt(garage_spaces, 10) || null : null;
    } else if (garage !== undefined) {
      // Support legacy field during transition (convert boolean/number to spaces)
      if (typeof garage === 'boolean') {
        updatePayload.garage_spaces = garage ? 1 : null;
      } else if (typeof garage === 'number') {
        updatePayload.garage_spaces = garage > 0 ? garage : null;
      } else if (typeof garage === 'string') {
        const num = parseInt(garage, 10);
        updatePayload.garage_spaces = num > 0 ? num : null;
      }
    }
    if (year_built !== undefined) {
      updatePayload.year_built = typeof year_built === 'number' ? year_built : typeof year_built === 'string' ? parseInt(year_built, 10) || null : null;
    }

    // Address fields
    let addressChanged = false;
    if (address !== undefined) {
      updatePayload.address = address?.trim() || null;
      if (address?.trim() !== existingListing.address) addressChanged = true;
    }
    if (city !== undefined) {
      updatePayload.city = city?.trim() || null;
      if (city?.trim() !== existingListing.city) addressChanged = true;
    }
    if (state !== undefined) {
      updatePayload.state = state?.trim() || null;
      if (state?.trim() !== existingListing.state) addressChanged = true;
    }
    if (zip !== undefined) {
      updatePayload.zip = zip?.trim() || null;
      if (zip?.trim() !== existingListing.zip) addressChanged = true;
    }

    // Geocode if address changed
    if (addressChanged) {
      const addressParts = [
        address !== undefined ? address : existingListing.address,
        city !== undefined ? city : existingListing.city,
        state !== undefined ? state : existingListing.state,
        zip !== undefined ? zip : existingListing.zip,
      ].filter(Boolean) as string[];

      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(', ');
        
        try {
          // Use geocodeAddress with address components for better accuracy
          const coordinates = await geocodeAddress(
            address !== undefined ? address : existingListing.address || '',
            city !== undefined ? city : existingListing.city || undefined,
            state !== undefined ? state : existingListing.state || undefined,
            zip !== undefined ? zip : existingListing.zip || undefined
          );

          if (coordinates) {
            console.log('✅ Geocoding successful for update:', { 
              listing_id: id, 
              address: fullAddress, 
              lat: coordinates.lat, 
              lng: coordinates.lng 
            });
            updatePayload.latitude = coordinates.lat;
            updatePayload.longitude = coordinates.lng;
            // Note: Database trigger should automatically update geom when latitude/longitude change
          } else {
            console.error('❌ Geocoding failed: No coordinates returned for address:', fullAddress);
            // Continue without updating coordinates - listing will be updated but coordinates remain unchanged
          }
        } catch (geocodeError) {
          console.error('❌ Geocoding error during update:', {
            listing_id: id,
            address: fullAddress,
            error: geocodeError instanceof Error ? geocodeError.message : String(geocodeError),
          });
          // Continue without updating coordinates - listing will be updated but coordinates remain unchanged
        }
      }
    }

    // Update listing
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update(updatePayload)
      .eq('id', id)
      .select('id, latitude, longitude')
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to update listing', details: updateError.message },
        { status: 500 }
      );
    }

    // If geom needs updating and we have coordinates, call an RPC or let database trigger handle it
    // Note: Database trigger should automatically update geom when latitude/longitude change
    if (addressChanged && updatePayload.latitude && updatePayload.longitude) {
      // Try to update geom using RPC (if available), otherwise rely on database trigger
      try {
        const { error: geomError } = await supabase.rpc('update_listing_geom', {
          listing_id: id,
          lng: updatePayload.longitude as number,
          lat: updatePayload.latitude as number,
        });

        if (geomError) {
          console.warn('Failed to update geom via RPC (non-critical, trigger should handle it):', geomError);
        }
      } catch (rpcError) {
        // RPC might not exist, that's okay - database trigger should handle geom update automatically
        console.warn('RPC function might not exist (non-critical, trigger should handle geom):', rpcError);
      }
    }

    const hasNewCoordinates = addressChanged && updatePayload.latitude && updatePayload.longitude;
    
    return NextResponse.json({
      id: updatedListing.id,
      latitude: updatedListing.latitude,
      longitude: updatedListing.longitude,
      message: addressChanged 
        ? (hasNewCoordinates 
          ? 'Listing updated successfully with new coordinates' 
          : 'Listing updated successfully, but geocoding failed (coordinates unchanged)')
        : 'Listing updated successfully',
    });
  } catch (error) {
    console.error('Error in listings PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

