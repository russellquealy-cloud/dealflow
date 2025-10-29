'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

export default function AdminWatchlists() {
  const [watchlists, setWatchlists] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchlists = async () => {
      try {
        const { data, error } = await supabase
          .from('user_watchlists')
          .select(`
            *,
            watchlist_items (
              id,
              listing_id,
              created_at
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setWatchlists(data || []);
      } catch (error) {
        console.error('Error loading watchlists:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWatchlists();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: '30px' }}>Watchlists Management (Admin)</h1>

      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠ Feature Status: Stub Implementation</h3>
        <p style={{ margin: '0', color: '#856404' }}>
          This is a placeholder implementation for testing. In production, this would include:
        </p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', color: '#856404' }}>
          <li>Property watchlist creation and management</li>
          <li>Real-time updates when watched properties change</li>
          <li>Email notifications for price changes</li>
          <li>Bulk watchlist operations</li>
        </ul>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading watchlists...</div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>User Watchlists ({watchlists.length})</h2>
            <button style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Create Test Watchlist
            </button>
          </div>

          {watchlists.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0', color: '#6c757d' }}>No watchlists found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {watchlists.map((watchlist: Record<string, unknown>) => (
                <div key={String(watchlist.id)} style={{
                  background: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>{String(watchlist.name) || 'Untitled Watchlist'}</h4>
                      <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>
                        {String(watchlist.description) || 'No description'}
                      </p>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#6c757d' }}>
                        <span>Items: {Array.isArray(watchlist.watchlist_items) ? watchlist.watchlist_items.length : 0}</span>
                        <span>Type: {String(watchlist.watchlist_type) || 'Property'}</span>
                        <span>Created: {new Date(String(watchlist.created_at)).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{
                        padding: '5px 10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        View Items
                      </button>
                      <button style={{
                        padding: '5px 10px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        Add Property
                      </button>
                      <button style={{
                        padding: '5px 10px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
