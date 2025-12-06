import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
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
    const supabase = await createSupabaseServer();
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

export async function POST(request: NextRequest) {
  try {
    // Use the same Supabase server client as canonical route
    const supabase = await createSupabaseServer();

    // Try getUser first (same as canonical route)
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    // Fallback to getSession if getUser fails (same as canonical route)
    if (userError || !user) {
      console.log('[api/messages][POST] getUser failed, trying getSession', {
        error: userError?.message,
        errorCode: userError?.status,
      });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[api/messages][POST] got session from getSession', {
          userId: user.id,
          email: user.email,
        });
      } else {
        console.log('[api/messages][POST] getSession also failed', {
          sessionError: sessionError?.message,
          hasSession: !!session,
        });
      }
    }

    console.log('[api/messages][POST] user', user?.id, user?.email);

    if (!user || userError) {
      console.error('[api/messages][POST] No auth user', { user, userError });
      return NextResponse.json(
        { error: 'Unable to determine authenticated user', message: null },
        { status: 401 },
      );
    }

    const body = await request.json() as {
      listingId?: string;
      recipientId?: string;
      message?: string;
    };

    const { listingId, recipientId, message } = body;

    if (!listingId || !recipientId || !message || !message.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields', message: null },
        { status: 400 },
      );
    }

    const trimmed = message.trim();

    // Get listing to verify it exists and get owner
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("owner_id, title")
      .eq("id", listingId)
      .single<{ owner_id: string | null; title: string | null }>();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found', message: null },
        { status: 400 },
      );
    }

    // Generate thread_id from user IDs and listing ID for consistent thread identification
    const threadString = [user.id, recipientId, listingId].sort().join("-");
    const threadId = uuidFromString(threadString);

    // Insert new message using from_id (matching RLS policy)
    const { data: newMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        from_id: user.id,
        to_id: recipientId,
        listing_id: listingId,
        body: trimmed,
        read_at: null
      } as never)
      .select("*")
      .single();

    if (messageError) {
      console.error('[api/messages][POST] Insert error', messageError);
      return NextResponse.json(
        { error: 'Failed to send message', message: null },
        { status: 400 },
      );
    }

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
          listingId,
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
