import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error in messages API:', sessionError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!session || !session.user) {
      console.log('No session found in messages API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    // Get all messages for this user
    // Optimize query by using index-friendly filters
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, listing:listings(id, title, address)')
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(500); // Reduced limit for better performance

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get user profiles for sender/recipient names
    const userIds = new Set<string>();
    messages?.forEach((msg: { from_id: string; to_id: string }) => {
      userIds.add(msg.from_id);
      userIds.add(msg.to_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', Array.from(userIds));

    const profileMap = new Map<string, string>();
    profiles?.forEach((p: { id: string; full_name?: string }) => {
      if (p.full_name) profileMap.set(p.id, p.full_name);
    });

    // Group messages by thread_id
    const conversationMap = new Map<string, {
      thread_id: string;
      listing_id: string;
      listing_title?: string;
      listing_address?: string;
      other_user_id: string;
      other_user_name?: string;
      last_message?: string;
      last_message_at?: string;
      unread_count: number;
      is_unread: boolean;
    }>();

    messages?.forEach((msg: {
      thread_id: string;
      listing_id: string;
      from_id: string;
      to_id: string;
      body: string;
      created_at: string;
      read_at: string | null;
      listing?: { title?: string; address?: string };
    }) => {
      const threadId = msg.thread_id;
      const isFromMe = msg.from_id === user.id;
      const otherUserId = isFromMe ? msg.to_id : msg.from_id;
      const otherUserName = profileMap.get(otherUserId);

      if (!conversationMap.has(threadId)) {
        conversationMap.set(threadId, {
          thread_id: threadId,
          listing_id: msg.listing_id,
          listing_title: msg.listing?.title,
          listing_address: msg.listing?.address,
          other_user_id: otherUserId,
          other_user_name: otherUserName,
          last_message: msg.body,
          last_message_at: msg.created_at,
          unread_count: !isFromMe && !msg.read_at ? 1 : 0,
          is_unread: !isFromMe && !msg.read_at
        });
      } else {
        const conv = conversationMap.get(threadId)!;
        if (new Date(msg.created_at) > new Date(conv.last_message_at || 0)) {
          conv.last_message = msg.body;
          conv.last_message_at = msg.created_at;
        }
        if (!isFromMe && !msg.read_at) {
          conv.unread_count += 1;
          conv.is_unread = true;
        }
      }
    });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => {
        const timeA = new Date(a.last_message_at || 0).getTime();
        const timeB = new Date(b.last_message_at || 0).getTime();
        return timeB - timeA;
      });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in conversations GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
