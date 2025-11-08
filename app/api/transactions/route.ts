import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

/**
 * GET /api/transactions
 * Fetch transactions for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Build query - users see their own transactions, admins see all
    let query = supabase
      .from('transactions')
      .select(`
        *,
        listings:listing_id(id, title, address, city, state),
        wholesaler:wholesaler_id(id, email, full_name),
        investor:investor_id(id, email, full_name)
      `)
      .order('close_date', { ascending: false });

    if (!isAdmin) {
      query = query.or(`wholesaler_id.eq.${user.id},investor_id.eq.${user.id}`);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('Error in transactions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Create a new transaction (requires both wholesaler and investor to confirm)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      listing_id,
      investor_id,
      close_date,
      close_price,
      rehab_cost,
      rehab_duration_days,
      after_repair_rent,
      exit_type,
      notes,
    } = body;

    // Validate required fields
    if (!listing_id || !investor_id || !close_date || !close_price) {
      return NextResponse.json(
        { error: 'Missing required fields: listing_id, investor_id, close_date, close_price' },
        { status: 400 }
      );
    }

    // Verify listing belongs to user (wholesaler)
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id, status')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only create transactions for your own listings' },
        { status: 403 }
      );
    }

    // Create transaction (both parties need to confirm)
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        listing_id,
        wholesaler_id: user.id,
        investor_id,
        close_date,
        close_price,
        rehab_cost,
        rehab_duration_days,
        after_repair_rent,
        exit_type,
        notes,
        wholesaler_confirmed: true, // Wholesaler confirms when creating
        investor_confirmed: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error in transactions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

