import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createApiSupabaseFromAuthHeader } from '@/lib/auth/apiSupabase';
import { notifyLeadMessage } from '@/lib/notifications';

// Generate deterministic UUID v5 from a string
function uuidFromString(str: string): string {
  const namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  const hash = createHash("sha1");
  hash.update(namespace.replace(/-/g, ""));
  hash.update(str);
  const hashHex = hash.digest("hex");
  return [
    hashHex.substring(0, 8),
    hashHex.substring(8, 12),
    "5" + hashHex.substring(13, 16),
    ((parseInt(hashHex.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hashHex.substring(17, 20),
    hashHex.substring(20, 32)
  ].join("-");
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const supabase = createApiSupabaseFromAuthHeader(authHeader);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      console.error('[api/messages] No auth user for request', { userError });
      return NextResponse.json({ messages: [], error: 'Not authenticated' }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ messages: [], error: 'Missing listingId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, from_id, to_id, body, created_at, read_at')
      .eq('listing_id', listingId)
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[api/messages] DB error', error);
      return NextResponse.json({ messages: [], error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error("Error in messages GET:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ messages: [], error: "Internal server error", details: errorMessage }, { status: 200 });
  }
}

type MessageBody = {
  listingId: string;
  recipientId: string;
  message: string;
};

export async function POST(req: NextRequest) {
  try {
    console.log('[api/messages][POST] ENTER');

    const authHeader = req.headers.get('authorization');
    console.log('[api/messages][POST] auth header present:', Boolean(authHeader));

    const supabase = createApiSupabaseFromAuthHeader(authHeader);

    // Resolve current user from Supabase using the bearer token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log('[api/messages][POST] getUser result', {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error: userError ? { message: userError.message, name: userError.name } : null,
    });

    if (userError || !user) {
      console.error('[api/messages][POST] NO AUTH USER', {
        hasUser: !!user,
        errorMessage: userError?.message ?? null,
      });

      return NextResponse.json(
        {
          error: 'Unable to determine authenticated user',
          details: userError ? userError.message : 'No user in Supabase session',
          message: null,
        },
        { status: 401 },
      );
    }

    // Parse request body
    const body = (await req.json()) as MessageBody;
    const trimmed = body.message.trim();

    if (!body.listingId || !body.recipientId || !trimmed) {
      return NextResponse.json(
        { error: 'Missing required fields', message: null },
        { status: 400 },
      );
    }

    // Get listing to verify it exists and get owner
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("owner_id, title")
      .eq("id", body.listingId)
      .single<{ owner_id: string | null; title: string | null }>();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found', message: null },
        { status: 400 },
      );
    }

    // Generate thread_id from user IDs and listing ID for consistent thread identification
    const threadString = [user.id, body.recipientId, body.listingId].sort().join("-");
    const threadId = uuidFromString(threadString);

    // Insert new message using from_id (matching RLS policy: auth.uid() = from_id)
    // IMPORTANT: use user.id as from_id; do not trust client for that
    const { data: newMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        from_id: user.id,
        to_id: body.recipientId,
        listing_id: body.listingId,
        body: trimmed,
        read_at: null
      } as never)
      .select("*")
      .single();

    if (messageError || !newMessage) {
      console.error('[api/messages][POST] insert error', {
        message: messageError?.message,
        details: messageError?.details,
        code: messageError?.code,
        hasNewMessage: !!newMessage,
      });

      return NextResponse.json(
        { error: 'Failed to send message', message: null, details: messageError?.message ?? 'Unknown error' },
        { status: 400 },
      );
    }

    // TypeScript needs explicit type assertion for single() result
    const message = newMessage as { id: string; listing_id: string | null; [key: string]: unknown };
    console.log('[api/messages][POST] success', { id: message.id, listing_id: message.listing_id });

    let followUp = false;
    if (listing.owner_id) {
      try {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", threadId);
        followUp = (count ?? 0) > 1;
      } catch (countError) {
        console.warn("Failed to count messages in thread", countError);
      }
    }

    if (listing.owner_id) {
      try {
        await notifyLeadMessage({
          ownerId: listing.owner_id,
          listingTitle: typeof listing.title === "string" ? listing.title : null,
          senderEmail: user.email ?? null,
          listingId: body.listingId,
          threadId,
          followUp,
        });
      } catch (notificationError) {
        console.error("Failed to queue lead notification", notificationError);
      }
    }

    return NextResponse.json(
      { error: null, message: newMessage },
      { status: 200 },
    );
  } catch (err) {
    console.error('[api/messages][POST] Unexpected error', err);
    return NextResponse.json(
      { error: 'Unexpected server error', message: null },
      { status: 500 },
    );
  }
}
