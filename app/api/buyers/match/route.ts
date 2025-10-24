import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('city, state, price, beds, baths, sqft, property_type')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Find matching buyers
    const { data: matches, error: matchError } = await supabase.rpc('find_matching_buyers', {
      listing_city: listing.city,
      listing_state: listing.state,
      listing_price: listing.price,
      listing_beds: listing.beds,
      listing_baths: listing.baths,
      listing_sqft: listing.sqft,
      listing_type: listing.property_type || 'single_family'
    });

    if (matchError) {
      throw new Error(`Failed to find matches: ${matchError.message}`);
    }

    return NextResponse.json({
      listing: {
        id: listingId,
        city: listing.city,
        state: listing.state,
        price: listing.price,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        property_type: listing.property_type
      },
      matches: matches || [],
      total_matches: matches?.length || 0
    });

  } catch (error) {
    console.error('Buyer matching error:', error);
    return NextResponse.json(
      { error: 'Failed to find matching buyers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { listingId, buyerId, contactType, message } = await request.json();

    if (!listingId || !buyerId || !contactType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can perform contact action
    const { data: canContact, error: permissionError } = await supabase.rpc('can_user_perform_action', {
      user_uuid: user.id,
      action_type: 'contacts',
      action_count: 1
    });

    if (permissionError || !canContact) {
      return NextResponse.json({ 
        error: 'Contact limit reached or insufficient permissions',
        upgrade_required: true 
      }, { status: 403 });
    }

    // Get buyer details
    const { data: buyer, error: buyerError } = await supabase
      .from('buyers')
      .select('name, email, phone, company')
      .eq('id', buyerId)
      .single();

    if (buyerError || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Log the contact action
    const { error: logError } = await supabase
      .from('contact_logs')
      .insert({
        user_id: user.id,
        listing_id: listingId,
        contact_type: contactType,
        contact_data: {
          buyer_id: buyerId,
          buyer_name: buyer.name,
          buyer_email: buyer.email,
          buyer_phone: buyer.phone,
          message: message || '',
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      throw new Error(`Failed to log contact: ${logError.message}`);
    }

    // Increment usage
    const { error: usageError } = await supabase.rpc('increment_subscription_usage', {
      user_uuid: user.id,
      action_type: 'contacts',
      action_count: 1
    });

    if (usageError) {
      console.error('Failed to increment usage:', usageError);
    }

    return NextResponse.json({
      success: true,
      buyer: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        company: buyer.company
      },
      contact_type: contactType,
      message: 'Contact logged successfully'
    });

  } catch (error) {
    console.error('Contact buyer error:', error);
    return NextResponse.json(
      { error: 'Failed to contact buyer' },
      { status: 500 }
    );
  }
}
