'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

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
  const { session, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const redirectRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      setConversations([]);
      setLoading(false);
      if (!redirectRef.current) {
        redirectRef.current = true;
        router.push('/login?next=/messages');
      }
      return;
    }

    let cancelled = false;
    setLoading(true);

    const loadConversations = async () => {
      try {
        logger.log('Fetching conversations from API...');
        const headers: HeadersInit = {
          'Cache-Control': 'no-cache',
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/messages/conversations', {
          credentials: 'include',
          cache: 'no-store',
          headers,
        });

        logger.log('API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('API error response:', errorText);
          
          if (response.status === 401) {
            if (!redirectRef.current) {
              redirectRef.current = true;
              router.push('/login?next=/messages');
            }
            if (!cancelled) {
              setLoading(false);
            }
            return;
          }
          throw new Error(`Failed to load conversations: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        logger.log('Received conversations data:', data);
        const conversationsList = data.conversations || [];

        if (!cancelled) {
          setConversations(conversationsList);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Error loading conversations:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [authLoading, session, router]);

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
              href={
                conv.listing_id
                  ? `/messages/${conv.listing_id}${
                      conv.thread_id ? `?thread=${encodeURIComponent(conv.thread_id)}` : ''
                    }`
                  : '#'
              }
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

