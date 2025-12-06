import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "../../supabase/server";
import { getAuthUserServer } from "@/lib/auth/server";
import { notifyLeadMessage } from "@/lib/notifications";

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

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
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
    // Use PKCE-aware auth helper that correctly reads dealflow-auth-token cookies
    const { user, supabase, error: userError } = await getAuthUserServer();
    
    if (userError || !user) {
      console.log('[messages] Auth failed', {
        hasUser: !!user,
        error: userError?.message,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const listingId = body?.listingId as string | undefined;
    const recipientId = body?.recipientId as string | undefined;
    const message = body?.message as string | undefined;

    if (!listingId || !recipientId || !message) {
      return NextResponse.json(
        { error: "Listing ID, recipient ID, and message are required" },
        { status: 400 }
      );
    }

    // Get listing to verify it exists and get owner
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("owner_id, title")
      .eq("id", listingId)
      .single<{ owner_id: string | null; title: string | null }>();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Generate thread_id from user IDs and listing ID for consistent thread identification
    const threadString = [user.id, recipientId, listingId].sort().join("-");
    const threadId = uuidFromString(threadString);

    // Create message
    // Use simpler syntax without foreign key names
    const { data: newMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        from_id: user.id,
        to_id: recipientId,
        listing_id: listingId,
        body: message,
        read_at: null
      } as never)
      .select("*")
      .single();

      if (messageError) {
        console.error("Error creating message:", messageError);
        // Return detailed error for debugging
        return NextResponse.json({ 
          error: "Failed to send message",
          details: messageError.message,
          code: messageError.code,
          hint: messageError.hint
        }, { status: 500 });
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

      return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error("Error in messages POST:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Full error details:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 });
  }
}

