import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth/server";

export const runtime = "nodejs";

type RawMessage = {
  thread_id: string;
  listing_id: string;
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
        return NextResponse.json({ conversations: fallback });
      } catch (fallbackError) {
        console.error("Fallback conversations error", fallbackError);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
      }
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (error) {
    console.error("Error in conversations GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
