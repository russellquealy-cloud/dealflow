'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

interface Conversation {
  thread_id: string;
  listing_id: string;
  listing_title?: string;
  listing_address?: string;
  other_user_id: string;
  other_user_name?: string;
  other_user_email?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  is_unread: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
      const [conversations, setConversations] = useState<Conversation[]>([]);
      const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    loadingRef.current = true;

    const loadConversations = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          loadingRef.current = false;
          return;
        }

        if (!session) {
          setLoading(false);
          loadingRef.current = false;
          // Only redirect if we're not already on the login page
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login')) {
            router.push('/login?next=' + encodeURIComponent('/messages'));
          }
          return;
        }

            // Get all messages for this user
        // Note: profiles table doesn't have email column, only full_name
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*, listing:listings(id, title, address), sender:profiles!messages_from_id_fkey(full_name), recipient:profiles!messages_to_id_fkey(full_name)')
          .or(`from_id.eq.${session.user.id},to_id.eq.${session.user.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading messages:', error);
          setLoading(false);
          return;
        }

        // Group messages by thread_id
        const conversationMap = new Map<string, Conversation>();

            messages?.forEach((msg: {
              thread_id: string;
              listing_id: string;
              from_id: string;
              to_id: string;
              body: string;
              created_at: string;
              read_at: string | null;
              listing?: { title?: string; address?: string };
              sender?: { full_name?: string };
              recipient?: { full_name?: string };
            }) => {
          const threadId = msg.thread_id;
          const isFromMe = msg.from_id === session.user.id;
          const otherUserId = isFromMe ? msg.to_id : msg.from_id;
          const otherUser = isFromMe ? msg.recipient : msg.sender;

          if (!conversationMap.has(threadId)) {
            conversationMap.set(threadId, {
              thread_id: threadId,
              listing_id: msg.listing_id,
              listing_title: msg.listing?.title,
              listing_address: msg.listing?.address,
              other_user_id: otherUserId,
              other_user_name: otherUser?.full_name,
              other_user_email: undefined, // Email not available from profiles table
              last_message: msg.body,
              last_message_at: msg.created_at,
              unread_count: !isFromMe && !msg.read_at ? 1 : 0,
              is_unread: !isFromMe && !msg.read_at
            });
          } else {
            const conv = conversationMap.get(threadId)!;
            // Update if this message is newer
            if (new Date(msg.created_at) > new Date(conv.last_message_at || 0)) {
              conv.last_message = msg.body;
              conv.last_message_at = msg.created_at;
            }
            // Count unread messages
            if (!isFromMe && !msg.read_at) {
              conv.unread_count += 1;
              conv.is_unread = true;
            }
          }
        });

        // Convert to array and sort by last message time
        const conversationsList = Array.from(conversationMap.values())
          .sort((a, b) => {
            const timeA = new Date(a.last_message_at || 0).getTime();
            const timeB = new Date(b.last_message_at || 0).getTime();
            return timeB - timeA; // Newest first
          });

        setConversations(conversationsList);
        setLoading(false);
        loadingRef.current = false;
      } catch (error) {
        console.error('Error loading conversations:', error);
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadConversations();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)' }}>
        <div>Loading messages...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', minHeight: 'calc(100vh - 100px)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>Messages</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          Your conversations with sellers and buyers
        </p>
      </div>

      {conversations.length === 0 ? (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          background: '#fff'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>No Messages Yet</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Start a conversation by messaging a seller from any listing.
          </p>
          <Link href="/listings" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Browse Listings
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {conversations.map((conv) => (
            <Link
              key={conv.thread_id}
              href={`/messages/${conv.listing_id}`}
              style={{
                display: 'block',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 20,
                background: conv.is_unread ? '#f0f9ff' : '#fff',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: '600', color: '#1a1a1a' }}>
                      {conv.listing_title || conv.listing_address || 'Property Listing'}
                    </h3>
                    {conv.is_unread && (
                      <span style={{
                        background: '#dc2626',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                    {conv.other_user_name || conv.other_user_email || 'User'}
                  </p>
                </div>
                {conv.last_message_at && (
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {new Date(conv.last_message_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {conv.last_message && (
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {conv.last_message}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

