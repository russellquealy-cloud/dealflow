'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

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
  const redirectRef = useRef(false);

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

    const loadData = async () => {
      try {
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

        if (response.status === 401) {
          if (!redirectRef.current) {
            redirectRef.current = true;
            router.push(`/login?next=/messages/${listingId}`);
          }
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

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
          setOtherUserId(counterpartId);
          setLoading(false);
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

      if (response.status === 401) {
        if (!redirectRef.current) {
          redirectRef.current = true;
          router.push(`/login?next=/messages/${listingId}`);
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Message send error:', errorData);
        alert(errorData.error || 'Failed to send message. Please try again.');
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)' }}>
        <div>Loading messages...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
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
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', minHeight: 'calc(100vh - 100px)' }}>
      <div style={{ marginBottom: 24 }}>
        <Link 
          href={`/listing/${listingId}`}
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8,
            background: '#0ea5e9',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          ← Back to Listing
        </Link>
      </div>

      {/* Listing Info */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        background: '#fff'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 700 }}>
          {listing.title || listing.address || 'Property Listing'}
        </h1>
        {listing.address && (
          <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: 14 }}>{listing.address}</p>
        )}
        {listing.price && (
          <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#059669' }}>
            ${listing.price.toLocaleString()}
          </p>
        )}
      </div>

      {/* Messages */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        background: '#fff',
        minHeight: 400,
        maxHeight: 600,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
            <p>No messages yet. Start the conversation below!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.from_id === session?.user.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: isOwn ? '#3b82f6' : '#f3f4f6',
                  color: isOwn ? '#fff' : '#111',
                }}>
                  {!isOwn && msg.sender && (
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
                      {msg.sender.full_name || msg.sender.email || 'Seller'}
                    </div>
                  )}
                  <div style={{ marginBottom: 4 }}>{msg.body}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input */}
      {!otherUserId ? (
        <div style={{
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: 20,
          background: '#fef2f2',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626', margin: 0 }}>
            ⚠️ Unable to load listing owner information. Please try refreshing the page.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: '#fff',
          display: 'flex',
          gap: 12
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14
            }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: 8,
              background: sending || !newMessage.trim() ? '#9ca3af' : '#3b82f6',
              color: '#fff',
              fontWeight: 600,
              cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}
    </div>
  );
}

