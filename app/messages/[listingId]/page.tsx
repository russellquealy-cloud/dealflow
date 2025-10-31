'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

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
  const router = useRouter();
  const listingId = params?.listingId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [listing, setListing] = useState<Listing | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const redirectAttemptedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    const loadData = async (retryCount = 0) => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }
        
        if (!session) {
          redirectAttemptedRef.current = true;
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login')) {
            router.push(`/login?next=/messages/${listingId}`);
          }
          return;
        }
        
        setUserId(session.user.id);

        // Load listing
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('id, title, address, price, owner_id')
          .eq('id', listingId)
          .single();

        if (listingError || !listingData) {
          console.error('Error loading listing:', listingError);
          setLoading(false);
          return;
        }

        console.log('Listing loaded:', listingData);
        setListing(listingData);
        const ownerId = listingData.owner_id || null;
        console.log('Owner ID:', ownerId);
        setOtherUserId(ownerId);
        
        if (!ownerId) {
          console.warn('No owner_id found for listing:', listingId);
          // Try to get owner from listing directly - maybe it's stored differently
          const { data: listingCheck } = await supabase
            .from('listings')
            .select('owner_id, user_id')
            .eq('id', listingId)
            .single();
          
          if (listingCheck) {
            const actualOwnerId = listingCheck.owner_id || (listingCheck as unknown as { user_id?: string }).user_id;
            if (actualOwnerId) {
              console.log('Found owner_id via alternative method:', actualOwnerId);
              setOtherUserId(actualOwnerId);
            }
          }
        }

        // Load messages with retry logic
        let messagesLoaded = false;
        for (let attempt = 0; attempt < 2 && !messagesLoaded; attempt++) {
          try {
            const response = await fetch(`/api/messages?listingId=${listingId}`, {
              credentials: 'include',
              cache: 'no-store', // Don't cache to ensure fresh data
            });
            
            if (response.ok) {
              const data = await response.json();
              setMessages(data.messages || []);
              messagesLoaded = true;
            } else if (response.status === 401 && attempt === 0) {
              // Retry once on 401 - might be cookie timing issue
              console.warn('Got 401, retrying in 500ms...');
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            } else if (response.status === 401) {
              console.error('Unauthorized response from API after retry');
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error('Error loading messages:', response.status, response.statusText, errorData);
            }
          } catch (fetchError) {
            if (attempt === 0) {
              console.warn('Fetch error, retrying...', fetchError);
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
            console.error('Error loading messages after retry:', fetchError);
          }
        }

        setLoading(false);
        loadingRef.current = false;
      } catch (error) {
        console.error('Error loading messages:', error);
        setLoading(false);
        loadingRef.current = false;
        
        // Retry once on error
        if (retryCount === 0) {
          console.log('Retrying loadData after error...');
          setTimeout(() => {
            loadingRef.current = false;
            loadData(1);
          }, 2000);
          return;
        }
      }
    };

    if (listingId) {
      loadData();
    }
    
    // Cleanup
    return () => {
      loadingRef.current = false;
    };
  }, [listingId, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId || sending) return;

    const messageText = newMessage.trim();
    setSending(true);
    
    // Try sending with retry logic for 401 errors
    let messageSent = false;
    for (let attempt = 0; attempt < 2 && !messageSent; attempt++) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            recipientId: otherUserId,
            message: messageText
          }),
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setMessages([...messages, data.message]);
          setNewMessage('');
          messageSent = true;
        } else if (response.status === 401 && attempt === 0) {
          // Retry once on 401 - might be cookie timing issue
          console.warn('Got 401 when sending, retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Message send error:', errorData);
          alert(errorData.error || 'Failed to send message. Please try again.\n' + (errorData.details || '') + (errorData.code ? `\nCode: ${errorData.code}` : ''));
          break;
        }
      } catch (error) {
        if (attempt === 0) {
          console.warn('Error sending message, retrying...', error);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        console.error('Error sending message after retry:', error);
        alert('Error sending message. Please try again.');
        break;
      }
    }
    
    setSending(false);
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
            const isOwn = msg.from_id === userId;
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

