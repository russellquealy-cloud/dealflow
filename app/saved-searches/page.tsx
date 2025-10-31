'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

interface SavedSearch {
  id: string;
  name: string;
  criteria: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

  useEffect(() => {
    const loadSearches = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?next=/saved-searches');
        return;
      }

      try {
        const response = await fetch('/api/saved-searches', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setSearches(data.searches || []);
        }
      } catch (error) {
        console.error('Error loading saved searches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSearches();
  }, [router]);

  const handleCreateFromCurrent = async () => {
    // Get current filters from URL or localStorage
    const currentFilters = JSON.parse(localStorage.getItem('currentFilters') || '{}');
    
    if (!newSearchName.trim()) {
      alert('Please enter a name for this search');
      return;
    }

    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSearchName,
          criteria: currentFilters,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSearches([...searches, data.search]);
        setNewSearchName('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating saved search:', error);
      alert('Failed to create saved search');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved search?')) return;

    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSearches(searches.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  const handleToggleActive = async (search: SavedSearch) => {
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: search.id,
          active: !search.active,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSearches(searches.map(s => s.id === search.id ? data.search : s));
      }
    } catch (error) {
      console.error('Error updating saved search:', error);
    }
  };

  const handleApplySearch = (search: SavedSearch) => {
    // Store criteria in localStorage and redirect to listings
    localStorage.setItem('savedSearchCriteria', JSON.stringify(search.criteria));
    router.push('/listings');
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div>Loading saved searches...</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>Saved Searches</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
            Save your favorite search criteria for quick access
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showCreateForm ? 'Cancel' : '+ New Search'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          background: '#fff'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Save Current Search</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="Enter a name for this search (e.g., 'Miami Under $100k')"
              value={newSearchName}
              onChange={(e) => setNewSearchName(e.target.value)}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFromCurrent()}
            />
            <button
              onClick={handleCreateFromCurrent}
              style={{
                padding: '12px 24px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#6b7280' }}>
            Go to the listings page, apply your filters, then come back here to save them.
          </p>
        </div>
      )}

      {searches.length === 0 ? (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          background: '#fff'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>No Saved Searches</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Save your search criteria to quickly find properties that match your preferences.
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
            Start Searching
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {searches.map((search) => (
            <div
              key={search.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 20,
                background: search.active ? '#fff' : '#f9fafb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
                    {search.name}
                  </h3>
                  {!search.active && (
                    <span style={{
                      padding: '2px 8px',
                      background: '#6b7280',
                      color: 'white',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      Inactive
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>
                  Created {new Date(search.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  {JSON.stringify(search.criteria).substring(0, 100)}...
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleApplySearch(search)}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Apply
                </button>
                <button
                  onClick={() => handleToggleActive(search)}
                  style={{
                    padding: '8px 16px',
                    background: search.active ? '#f3f4f6' : '#059669',
                    color: search.active ? '#6b7280' : 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {search.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(search.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#fff',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

