import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth/server";

export const runtime = "nodejs";

type RawMessage = {
  thread_id: string;
  listing_id: string | null;
  from_id: string;
  to_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  listing?: { title?: string | null; address?: string | null } | null;
};

type ProfileSummary = {
  id: string;
  full_name?: string | null;
};

type ListingSummary = {
  id: string;
  title?: string | null;
  address?: string | null;
  owner_id: string;
};

type ConversationSummary = {
  thread_id: string;
  listing_id: string | null;
  listing_title?: string | null;
  listing_address?: string | null;
  other_user_id: string;
  other_user_name?: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  is_unread: boolean;
};

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
    ((parseInt(hashHex.substring(16, 17), 16) & 0x3) | 0x8).toString(16) +
      hashHex.substring(17, 20),
    hashHex.substring(20, 32),
  ].join("-");
}

function computeThreadId(
  participantA: string,
  participantB: string,
  listingId: string
): string {
  const components = [participantA, participantB, listingId].sort();
  return uuidFromString(components.join("-"));
}

async function buildConversationFallback(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("thread_id, listing_id, from_id, to_id, body, created_at, read_at, listing:listings(id, title, address)")
    .or(`from_id.eq.${userId},to_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  const typedMessages = (messages ?? []) as RawMessage[];

  const userIds = new Set<string>();
  typedMessages.forEach((message) => {
    userIds.add(message.from_id);
    userIds.add(message.to_id);
  });

  const profileMap = new Map<string, string>();
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(userIds));
    profiles?.forEach((profile: ProfileSummary) => {
      if (profile.full_name) {
        profileMap.set(profile.id, profile.full_name);
      }
    });
  }

  const conversationMap = new Map<
    string,
    {
      thread_id: string;
      listing_id: string;
      listing_title?: string | null;
      listing_address?: string | null;
      other_user_id: string;
      other_user_name?: string;
      last_message?: string;
      last_message_at?: string;
      unread_count: number;
      is_unread: boolean;
    }
  >();

  typedMessages.forEach((message) => {
    const isFromUser = message.from_id === userId;
    const otherUserId = isFromUser ? message.to_id : message.from_id;
    const existing = conversationMap.get(message.thread_id);

    if (!existing) {
      conversationMap.set(message.thread_id, {
        thread_id: message.thread_id,
        listing_id: message.listing_id,
        listing_title: message.listing?.title,
        listing_address: message.listing?.address,
        other_user_id: otherUserId,
        other_user_name: profileMap.get(otherUserId),
        last_message: message.body,
        last_message_at: message.created_at,
        unread_count: !isFromUser && !message.read_at ? 1 : 0,
        is_unread: !isFromUser && !message.read_at,
      });
      return;
    }

    if (
      message.created_at &&
      (!existing.last_message_at ||
        new Date(message.created_at).getTime() >
          new Date(existing.last_message_at).getTime())
    ) {
      existing.last_message = message.body;
      existing.last_message_at = message.created_at;
    }

    if (!isFromUser && !message.read_at) {
      existing.unread_count += 1;
      existing.is_unread = true;
    }
  });

  return Array.from(conversationMap.values()).sort((a, b) => {
    const timeA = new Date(a.last_message_at ?? 0).getTime();
    const timeB = new Date(b.last_message_at ?? 0).getTime();
    return timeB - timeA;
  });
}

async function hydrateConversations(
  supabase: SupabaseClient,
  currentUserId: string,
  conversations: ConversationSummary[] | null | undefined
): Promise<ConversationSummary[]> {
  if (!conversations || conversations.length === 0) {
    return [];
  }

  const cache = new Map<string, ListingSummary[]>();
  const hydrated: ConversationSummary[] = [];

  for (const convo of conversations) {
    const copy: ConversationSummary = { ...convo };

    if (!copy.listing_id && copy.thread_id && copy.other_user_id) {
      const participantIds = [currentUserId, copy.other_user_id].sort();
      const cacheKey = participantIds.join(":");
      let listings = cache.get(cacheKey);

      if (!listings) {
        const { data } = await supabase
          .from("listings")
          .select("id, title, address, owner_id")
          .in("owner_id", participantIds);
        listings = (data as ListingSummary[]) ?? [];
        cache.set(cacheKey, listings);
      }

      const match = listings.find((listing) => {
        const threadId = computeThreadId(
          participantIds[0],
          participantIds[1],
          listing.id
        );
        return threadId === copy.thread_id;
      });

      if (match) {
        copy.listing_id = match.id;
        copy.listing_title = copy.listing_title ?? match.title;
        copy.listing_address = copy.listing_address ?? match.address;

        // Best-effort repair of historical rows missing listing_id
        try {
          await supabase
            .from("messages")
            .update({ listing_id: match.id })
            .eq("thread_id", copy.thread_id)
            .is("listing_id", null);
        } catch (updateError) {
          console.warn(
            "Failed to backfill listing_id on messages thread:",
            updateError
          );
        }
      }
    }

    hydrated.push(copy);
  }

  return hydrated;
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("messages_conversations_view")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations view, attempting fallback", error);
      try {
        const fallback = await buildConversationFallback(supabase, user.id);
        const hydratedFallback = await hydrateConversations(
          supabase,
          user.id,
          fallback
        );
        return NextResponse.json({ conversations: hydratedFallback });
      } catch (fallbackError) {
        console.error("Fallback conversations error", fallbackError);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
      }
    }

    const hydrated = await hydrateConversations(
      supabase,
      user.id,
      data as ConversationSummary[]
    );

    return NextResponse.json({ conversations: hydrated });
  } catch (error) {
    console.error("Error in conversations GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
