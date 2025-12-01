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

    // Reset redirectRef when session changes (allows retry after login)
    if (session) {
      redirectRef.current = false;
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
          
          // Only log 401 errors in development to avoid console spam
          if (response.status === 401) {
            if (process.env.NODE_ENV === 'development') {
              logger.error('API error response:', errorText);
            }
            // Only redirect once - use redirectRef to prevent loops
            if (!redirectRef.current) {
              redirectRef.current = true;
              router.push('/login?next=/messages');
            }
            if (!cancelled) {
              setLoading(false);
            }
            return;
          }
          
          // Log other errors normally
          logger.error('API error response:', errorText);
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
    <div style={{ 
      padding: '12px',
      maxWidth: 1000, 
      margin: '0 auto', 
      minHeight: 'calc(100vh - 100px)' 
    }}>
      <style>{`
        @media (min-width: 768px) {
          .messages-list-page {
            padding: 24px !important;
          }
        }
      `}</style>
      <div className="messages-list-page" style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700 }}>Messages</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 'clamp(14px, 3vw, 16px)' }}>
            Your conversations with sellers and buyers
          </p>
        </div>

        {conversations.length === 0 ? (
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '48px 24px',
            textAlign: 'center',
            background: '#fff',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', marginBottom: '8px' }}>No Messages Yet</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: 'clamp(14px, 3vw, 16px)' }}>
              Start a conversation by messaging a seller from any listing.
            </p>
            <Link href="/listings" style={{
              display: 'inline-block',
              padding: '12px 24px',
              minHeight: '44px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              touchAction: 'manipulation'
            }}>
              Browse Listings
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10
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
                  padding: '16px',
                  background: conv.is_unread ? '#f0f9ff' : '#fff',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {conv.is_unread && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    minWidth: '24px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingRight: conv.is_unread ? 50 : 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: 'clamp(16px, 3vw, 18px)', 
                        fontWeight: conv.is_unread ? '700' : '600', 
                        color: '#1a1a1a',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.listing_title || conv.listing_address || 'Property Listing'}
                      </h3>
                    </div>
                    <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#6b7280' }}>
                      {conv.other_user_name || conv.other_user_email || 'User'}
                    </p>
                  </div>
                  {conv.last_message_at && (
                    <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {(() => {
                        const date = new Date(conv.last_message_at);
                        const now = new Date();
                        const diffMs = now.getTime() - date.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMs / 3600000);
                        const diffDays = Math.floor(diffMs / 86400000);
                        
                        if (diffMins < 1) return 'Just now';
                        if (diffMins < 60) return `${diffMins}m ago`;
                        if (diffHours < 24) return `${diffHours}h ago`;
                        if (diffDays < 7) return `${diffDays}d ago`;
                        return date.toLocaleDateString();
                      })()}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: conv.is_unread ? '#1f2937' : '#6b7280',
                    fontWeight: conv.is_unread ? '500' : '400',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: conv.is_unread ? 50 : 0
                  }}>
                    {conv.last_message}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
