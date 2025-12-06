import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { cookies, headers as nextHeaders } from 'next/headers';
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

type MessageBody = {
  listingId: string;
  recipientId: string;
  message: string;
};

export async function POST(request: NextRequest) {
  try {
    console.log('[api/messages][POST] ENTER');

    // Log cookie and header info before creating client (same pattern as canonical route)
    const cookieStore = await cookies();
    const headerStore = await nextHeaders();
    
    console.log('[api/messages][POST] cookie keys:', cookieStore.getAll().map(c => c.name));
    console.log('[api/messages][POST] auth header present:', !!headerStore.get('authorization'));

    // Use the same Supabase server client as canonical route
    const supabase = await createSupabaseServer();

    console.log('[api/messages][POST] after createSupabaseServer');

    // Try getUser first (same as canonical route)
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[api/messages][POST] getUser result', {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error: userError ? { message: userError.message, name: userError.name } : null,
    });

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

    if (!user || userError) {
      console.error('[api/messages][POST] NO AUTH USER', {
        hasUser: !!user,
        errorMessage: userError?.message ?? null,
      });

      return NextResponse.json(
        { error: 'Unable to determine authenticated user', message: null },
        { status: 401 },
      );
    }

    const body = (await request.json()) as MessageBody;
    const trimmed = body.message.trim();

    if (!body.listingId || !body.recipientId || !trimmed) {
      return NextResponse.json(
        { error: 'Message cannot be empty', message: null },
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

    if (messageError) {
      console.error('[api/messages][POST] insert error', {
        message: messageError.message,
        details: messageError.details,
        code: messageError.code,
      });

      return NextResponse.json(
        { error: 'Failed to send message', message: null },
        { status: 400 },
      );
    }

    console.log('[api/messages][POST] success', { id: newMessage.id, listing_id: newMessage.listing_id });

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
