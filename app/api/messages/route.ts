import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getUserFromRequest } from '@/lib/auth/server';
import { notifyLeadMessage, createNotification } from '@/lib/notifications';
import { getSupabaseServiceRole } from '@/lib/supabase/service';

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

export async function GET(req: NextRequest) {
  try {
    // Use the unified auth helper (tries cookies first, falls back to Bearer token)
    const { user, supabase } = await getUserFromRequest(req);

    const { searchParams } = new URL(req.url);
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
    // Handle 401 Response from getUserFromRequest
    if (error instanceof Response) {
      return error;
    }
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

    // Use the unified auth helper (tries cookies first, falls back to Bearer token)
    const { user, supabase, source } = await getUserFromRequest(req);

    console.log('[api/messages][POST] Authenticated user', {
      userId: user.id,
      email: user.email,
      source,
    });

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
    console.log('[api/messages][POST] Message inserted', { 
      id: message.id, 
      listing_id: message.listing_id,
      from_id: user.id,
      to_id: body.recipientId,
    });

    // Determine if this is a follow-up message (not the first in the thread)
    let followUp = false;
    try {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", threadId);
      followUp = (count ?? 0) > 1;
    } catch (countError) {
      console.warn("Failed to count messages in thread", countError);
    }

    const listingTitle = typeof listing.title === "string" ? listing.title : null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
    const messageUrl = `${siteUrl}/messages/${body.listingId}${threadId ? `?thread=${threadId}` : ''}`;

    // Create notification for the RECIPIENT (always, if recipient is not the sender)
    if (body.recipientId !== user.id) {
      try {
        // Get recipient's profile name for personalized notification
        const { data: recipientProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", body.recipientId)
          .single();

        const senderName = user.email || 'Someone';
        const title = listingTitle
          ? followUp
            ? `New message on ${listingTitle}`
            : `New message about ${listingTitle}`
          : followUp
          ? 'New message'
          : 'New message';

        const bodyText = listingTitle
          ? `${senderName} sent you a message about "${listingTitle}".`
          : `${senderName} sent you a message.`;

        const serviceSupabase = await getSupabaseServiceRole();
        await createNotification({
          userId: body.recipientId,
          type: 'lead_message', // Reuse lead_message type for all message notifications
          title,
          body: bodyText,
          listingId: body.listingId,
          metadata: {
            threadId,
            fromUserId: user.id,
            messageId: message.id,
          },
          supabaseClient: serviceSupabase,
          sendEmail: true,
          emailSubject: title,
          emailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">${title}</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">${bodyText}</p>
              <p style="margin-top: 24px;"><a href="${messageUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Message</a></p>
              <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
            </div>
          `,
        });
      } catch (recipientNotificationError) {
        console.error("Failed to create notification for recipient", recipientNotificationError);
      }
    }

    // Also notify the listing OWNER if they're different from the recipient
    if (listing.owner_id && listing.owner_id !== body.recipientId && listing.owner_id !== user.id) {
      try {
        await notifyLeadMessage({
          ownerId: listing.owner_id,
          listingTitle,
          senderEmail: user.email ?? null,
          listingId: body.listingId,
          threadId,
          followUp,
        });
      } catch (ownerNotificationError) {
        console.error("Failed to queue lead notification for owner", ownerNotificationError);
      }
    }

    return NextResponse.json(
      { error: null, message: newMessage },
      { status: 200 },
    );
  } catch (err) {
    // Handle 401 Response from getUserFromRequest
    if (err instanceof Response) {
      return err;
    }
    console.error('[api/messages][POST] Unexpected error', err);
    return NextResponse.json(
      { error: 'Unexpected server error', message: null },
      { status: 500 },
    );
  }
}
