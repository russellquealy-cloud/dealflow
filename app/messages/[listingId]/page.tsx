'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { SessionGuard } from '@/components/SessionGuard';

interface Message {
  id: string;
  from_id: string;
  to_id: string;
  listing_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: { full_name?: string; email?: string };
  recipient?: { full_name?: string; email?: string };
}

interface Listing {
  id: string;
  title?: string;
  address?: string;
  price?: number;
  owner_id?: string;
}

interface ProfileSnapshot {
  id: string;
  role?: string | null;
  segment?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  profile_photo_url?: string | null;
  phone_verified?: boolean | null;
  is_pro_subscriber?: boolean | null;
  buy_markets?: string[] | null;
  buy_property_types?: string[] | null;
  buy_price_min?: number | null;
  buy_price_max?: number | null;
  buy_strategy?: string | null;
  buy_condition?: string | null;
  capital_available?: number | null;
  wholesale_markets?: string[] | null;
  deal_arbands?: string[] | null;
  deal_discount_target?: number | null;
  assignment_methods?: string[] | null;
  avg_days_to_buyer?: number | null;
}

const formatList = (values?: string[] | null, max = 3): string => {
  if (!Array.isArray(values) || values.length === 0) return '—';
  const trimmed = values.filter((item) => typeof item === 'string' && item.trim().length > 0);
  if (trimmed.length === 0) return '—';
  const shown = trimmed.slice(0, max).join(', ');
  return trimmed.length > max ? `${shown}…` : shown;
};

export default function MessagesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = params?.listingId as string;
  const threadParam = searchParams?.get('thread') ?? null;
  const { session, loading: authLoading } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [listing, setListing] = useState<Listing | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [counterpartProfile, setCounterpartProfile] = useState<ProfileSnapshot | null>(null);
  const redirectRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  // Auto-scroll to bottom when messages load or new message is added
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    if (!listingId || authLoading) {
      return;
    }
    
    if (!session) {
      setLoading(false);
      if (!redirectRef.current) {
        redirectRef.current = true;
        router.push(`/login?next=/messages/${listingId}`);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    hasScrolledRef.current = false;

    const loadData = async () => {
      try {
        setCounterpartProfile(null);
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('id, title, address, price, owner_id')
          .eq('id', listingId)
          .single();

        if (listingError || !listingData) {
          console.error('Error loading listing:', listingError);
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        setListing(listingData);

        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const fetchUrl = `/api/messages?listingId=${listingId}${
          threadParam ? `&threadId=${encodeURIComponent(threadParam)}` : ''
        }`;

        const response = await fetch(fetchUrl, {
          credentials: 'include',
          cache: 'no-store',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error loading messages:', response.status, response.statusText, errorData);
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          const loadedMessages: Message[] = data.messages || [];
          setMessages(loadedMessages);

          const currentUserId = session.user.id;
          let counterpartId: string | null = null;
          for (const msg of loadedMessages) {
            if (msg.from_id !== currentUserId) {
              counterpartId = msg.from_id;
              break;
            }
            if (msg.to_id !== currentUserId) {
              counterpartId = msg.to_id;
              break;
            }
          }
          if (!counterpartId) {
            if (threadParam && data.counterpartId) {
              counterpartId = data.counterpartId as string | null;
            } else if (listingData.owner_id && listingData.owner_id !== currentUserId) {
              counterpartId = listingData.owner_id;
            }
          }

          let counterpartProfileData: ProfileSnapshot | null = null;
          if (counterpartId) {
            const { data: profileRow, error: profileError } = await supabase
              .from('profiles')
              .select(
                'id, role, segment, full_name, company_name, profile_photo_url, phone_verified, is_pro_subscriber, buy_markets, buy_property_types, buy_price_min, buy_price_max, buy_strategy, buy_condition, capital_available, wholesale_markets, deal_arbands, deal_discount_target, assignment_methods, avg_days_to_buyer'
              )
              .eq('id', counterpartId)
              .single();

            if (!profileError && profileRow) {
              counterpartProfileData = profileRow as ProfileSnapshot;
            }
          }

          if (!cancelled) {
            setOtherUserId(counterpartId);
            setCounterpartProfile(counterpartProfileData);
            setLoading(false);
            // Scroll to bottom after messages load
            setTimeout(() => {
              if (!hasScrolledRef.current) {
                scrollToBottom();
                hasScrolledRef.current = true;
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [authLoading, session, listingId, router, threadParam]);

  // Scroll to bottom when new message is added
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId || sending) return;
    if (!session) {
      router.push(`/login?next=/messages/${listingId}`);
      return;
    }

    const messageText = newMessage.trim();
    setSending(true);

    try {
      const postHeaders: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        postHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify({
          listingId,
          recipientId: otherUserId,
          message: messageText
        }),
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('[Messages] Failed to send message', response.status, data);
        alert(data.error ?? 'Failed to send message. Please try again.');
        // IMPORTANT: DO NOT do router.push('/login') or similar here
        return;
      }

      // Append the new message to local state if needed
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      setNewMessage('');
      // Scroll will happen via useEffect
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 100px)' 
      }}>
        <div>Loading messages...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ 
        padding: '16px', 
        maxWidth: 800, 
        margin: '0 auto' 
      }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Listing Not Found</h2>
          <Link href="/listings" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            ← Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SessionGuard>
      <div style={{ 
        padding: '12px',
        maxWidth: 1000, 
        margin: '0 auto', 
        minHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <style>{`
          @media (min-width: 768px) {
            .messages-page-container {
              padding: 16px !important;
            }
          }
        `}</style>
        <div className="messages-page-container" style={{ 
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0
        }}>
          <div style={{ marginBottom: 16, flexShrink: 0 }}>
            <Link 
              href={`/listing/${listingId}`}
              style={{ 
                display: 'inline-block',
                padding: '10px 16px', 
                minHeight: '44px',
                border: '1px solid #0ea5e9', 
                borderRadius: 8,
                background: '#0ea5e9',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '14px',
                touchAction: 'manipulation'
              }}
            >
              ← Back to Listing
            </Link>
          </div>

          {/* Listing Info */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            background: '#fff',
            flexShrink: 0
          }}>
            <h1 style={{ margin: '0 0 6px 0', fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700 }}>
              {listing.title || listing.address || 'Property Listing'}
            </h1>
            {listing.address && (
              <p style={{ margin: '0 0 6px 0', color: '#6b7280', fontSize: 14 }}>{listing.address}</p>
            )}
            {listing.price && (
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#059669' }}>
                ${listing.price.toLocaleString()}
              </p>
            )}
          </div>

          {counterpartProfile && (
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flexShrink: 0
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
                Conversation with {counterpartProfile.company_name || counterpartProfile.full_name || 'Partner'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid #cbd5f5',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontWeight: 600,
                }}>
                  {(counterpartProfile.segment || counterpartProfile.role || 'investor').toUpperCase()}
                </span>
                {counterpartProfile.is_pro_subscriber && (
                  <span style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: '1px solid #c084fc',
                    background: '#f3e8ff',
                    color: '#7c3aed',
                    fontWeight: 600,
                  }}>
                    Pro
                  </span>
                )}
                {counterpartProfile.phone_verified && (
                  <span style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: '1px solid #34d399',
                    background: '#d1fae5',
                    color: '#047857',
                    fontWeight: 600,
                  }}>
                    Phone verified
                  </span>
                )}
              </div>
              {(() => {
                const counterpartRole = (counterpartProfile.segment || counterpartProfile.role || '').toLowerCase();
                if (counterpartRole === 'wholesaler') {
                  return (
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                      <div>Markets: {formatList(counterpartProfile.wholesale_markets, 4)}</div>
                      <div>Assignment methods: {formatList(counterpartProfile.assignment_methods, 4)}</div>
                      {typeof counterpartProfile.deal_discount_target === 'number' && Number.isFinite(counterpartProfile.deal_discount_target) && (
                        <div>Discount target: {counterpartProfile.deal_discount_target}% below ARV</div>
                      )}
                      {typeof counterpartProfile.avg_days_to_buyer === 'number' && Number.isFinite(counterpartProfile.avg_days_to_buyer) && (
                        <div>Average days to buyer: {counterpartProfile.avg_days_to_buyer}</div>
                      )}
                    </div>
                  );
                }
                return (
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                    <div>Buy markets: {formatList(counterpartProfile.buy_markets, 4)}</div>
                    <div>Property types: {formatList(counterpartProfile.buy_property_types, 4)}</div>
                    {(() => {
                      const min = typeof counterpartProfile.buy_price_min === 'number' && Number.isFinite(counterpartProfile.buy_price_min)
                        ? counterpartProfile.buy_price_min
                        : null;
                      const max = typeof counterpartProfile.buy_price_max === 'number' && Number.isFinite(counterpartProfile.buy_price_max)
                        ? counterpartProfile.buy_price_max
                        : null;
                      if (min !== null && max !== null) {
                        return (
                          <div>
                            Price range: ${min.toLocaleString()} – ${max.toLocaleString()}
                          </div>
                        );
                      }
                      if (min !== null) {
                        return <div>Minimum buy price: ${min.toLocaleString()}</div>;
                      }
                      if (max !== null) {
                        return <div>Maximum buy price: ${max.toLocaleString()}</div>;
                      }
                      return null;
                    })()}
                    {counterpartProfile.buy_strategy && <div>Strategy: {counterpartProfile.buy_strategy}</div>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '12px',
              marginBottom: 16,
              background: '#fff',
              maxHeight: 'calc(100vh - 400px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              flex: 1,
              minHeight: 0
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                <p>No messages yet. Start the conversation below!</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isOwn = msg.from_id === session?.user.id;
                  const isRead = msg.read_at !== null;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: isOwn ? '#3b82f6' : '#f3f4f6',
                        color: isOwn ? '#fff' : '#111',
                      }}>
                        {!isOwn && msg.sender && (
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
                            {msg.sender.full_name || msg.sender.email || 'Seller'}
                          </div>
                        )}
                        <div style={{ marginBottom: 4, wordBreak: 'break-word' }}>{msg.body}</div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6,
                          fontSize: 11, 
                          opacity: 0.7 
                        }}>
                          <span>{new Date(msg.created_at).toLocaleString()}</span>
                          {isOwn && (
                            <span style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: 14,
                              opacity: isRead ? 1 : 0.5
                            }}>
                              {isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          {!otherUserId ? (
            <div style={{
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: 16,
              background: '#fef2f2',
              textAlign: 'center',
              flexShrink: 0
            }}>
              <p style={{ color: '#dc2626', margin: 0, fontSize: 14 }}>
                ⚠️ Unable to load listing owner information. Please try refreshing the page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '12px',
              background: '#fff',
              display: 'flex',
              gap: 8,
              flexShrink: 0
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '10px 14px',
                  minHeight: '44px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  minWidth: '80px',
                  border: 'none',
                  borderRadius: 8,
                  background: sending || !newMessage.trim() ? '#9ca3af' : '#3b82f6',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap'
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </div>
    </SessionGuard>
  );
}
