import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';
import { createHash } from 'crypto';

// Generate deterministic UUID v5 from a string
function uuidFromString(str: string): string {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const hash = createHash('sha1');
  hash.update(namespace.replace(/-/g, ''));
  hash.update(str);
  const hashHex = hash.digest('hex');
  return [
    hashHex.substring(0, 8),
    hashHex.substring(8, 12),
    '5' + hashHex.substring(13, 16),
    ((parseInt(hashHex.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hashHex.substring(17, 20),
    hashHex.substring(20, 32)
  ].join('-');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User error:', userError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    // Get listing to find owner
    const { data: listing, error: listingQueryError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single();

    if (listingQueryError) {
      console.error('Error fetching listing:', listingQueryError);
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (!listing.owner_id) {
      console.error('Listing has no owner_id:', listingId);
      return NextResponse.json({ error: 'Listing owner not found' }, { status: 404 });
    }

    // Generate thread_id from user IDs and listing ID for consistent thread identification
    const threadString = [user.id, listing.owner_id, listingId].sort().join('-');
    const threadId = uuidFromString(threadString);

    // Get messages for this conversation (thread)
    // Fetch messages without joins to avoid foreign key syntax issues
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      // Return detailed error for debugging
      return NextResponse.json({ 
        error: 'Failed to fetch messages',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in messages GET:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User error:', userError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, recipientId, message } = body;

    if (!listingId || !recipientId || !message) {
      return NextResponse.json(
        { error: 'Listing ID, recipient ID, and message are required' },
        { status: 400 }
      );
    }

    // Get listing to verify it exists and get owner
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Generate thread_id from user IDs and listing ID for consistent thread identification
    const threadString = [user.id, recipientId, listingId].sort().join('-');
    const threadId = uuidFromString(threadString);

    // Create message
    // Use simpler syntax without foreign key names
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        from_id: user.id,
        to_id: recipientId,
        body: message,
        read_at: null
      })
      .select('*')
      .single();

      if (messageError) {
        console.error('Error creating message:', messageError);
        // Return detailed error for debugging
        return NextResponse.json({ 
          error: 'Failed to send message',
          details: messageError.message,
          code: messageError.code,
          hint: messageError.hint
        }, { status: 500 });
      }

      // Send notification email to recipient
      // TODO: Implement email notifications when recipient email can be retrieved from auth.users
      // Currently commented out as we need admin client or RPC function to get user email

      return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Error in messages POST:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

