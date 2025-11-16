'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Filters } from '@/components/FiltersBar';
import type { BoundsPayload } from '@/components/GoogleMapImpl';
import { useAuth } from '@/providers/AuthProvider';

interface SavedSearch {
  id: string;
  name: string;
  criteria: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

type SavedSearchCriteria = {
  filters?: Partial<Filters> | null;
  searchQuery?: string | null;
  bounds?: BoundsPayload | null;
};

export default function SavedSearchesPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [criteriaPreview, setCriteriaPreview] = useState<string>('');

  const authToken = useMemo(() => session?.access_token ?? null, [session]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      router.push('/login?next=/saved-searches');
      return;
    }

    const headers: HeadersInit = {};
    if (session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    fetch('/api/saved-searches', {
      credentials: 'include',
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Failed to load saved searches: ${response.status} ${text}`);
        }
        const data = await response.json();
        setSearches(data.searches || []);
      })
      .catch((error) => {
        console.error('Error loading saved searches:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, session, router]);

  useEffect(() => {
    if (!showCreateForm) {
      setCriteriaPreview('');
      return;
    }

    const currentState = readCurrentSearchState();
    setCriteriaPreview(summarizeCriteria(currentState));
    setNewSearchName(generateSearchName(currentState));
  }, [showCreateForm]);

  const handleCreateFromCurrent = async () => {
    if (!authToken) {
      alert('Please sign in to save searches.');
      return;
    }

    const currentState = readCurrentSearchState();

    if (!newSearchName.trim()) {
      alert('Please enter a name for this search');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newSearchName,
          criteria: currentState,
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
      if (!authToken) {
        alert('Please sign in to modify saved searches.');
        return;
      }

      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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
      if (!authToken) {
        alert('Please sign in to modify saved searches.');
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      const response = await fetch('/api/saved-searches', {
        method: 'PUT',
        headers,
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

  if (loading || authLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div>Loading saved searches...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main style={{ 
      padding: '12px',
      maxWidth: 1000, 
      margin: '0 auto',
      minHeight: 'calc(100vh - 100px)'
    }}>
      <style>{`
        @media (min-width: 768px) {
          .saved-searches-page {
            padding: 24px !important;
          }
        }
      `}</style>
      <div className="saved-searches-page" style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: 8 }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700 }}>Saved Searches</h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 'clamp(14px, 3vw, 16px)' }}>
                Save your favorite search criteria for quick access
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              style={{
                padding: '12px 24px',
                minHeight: '44px',
                background: showCreateForm ? '#6b7280' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                touchAction: 'manipulation',
                whiteSpace: 'nowrap'
              }}
            >
              {showCreateForm ? 'Cancel' : '+ New Search'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20,
            background: '#fff',
            flexShrink: 0
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Save Current Search</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Enter a name for this search (e.g., 'Miami Under $100k')"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px',
                  minHeight: '44px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFromCurrent()}
              />
              <button
                onClick={handleCreateFromCurrent}
                style={{
                  padding: '12px 24px',
                  minHeight: '44px',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap'
                }}
              >
                Save
              </button>
            </div>
            {criteriaPreview && (
              <p style={{ margin: '12px 0 0 0', fontSize: 13, color: '#4b5563' }}>
                {criteriaPreview}
              </p>
            )}
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#6b7280' }}>
              Go to the listings page, apply your filters, then come back here to save them.
            </p>
          </div>
        )}

        {searches.length === 0 ? (
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', marginBottom: '8px' }}>No Saved Searches</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: 'clamp(14px, 3vw, 16px)' }}>
              Save your search criteria to quickly find properties that match your preferences.
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
              Start Searching
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, flex: 1, overflowY: 'auto' }}>
            <style>{`
              @media (min-width: 768px) {
                .saved-searches-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
                }
              }
            `}</style>
            <div className="saved-searches-grid" style={{ display: 'grid', gap: 12 }}>
              {searches.map((search) => (
                <div
                  key={search.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '16px',
                    background: search.active ? '#fff' : '#f9fafb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 600, color: '#1a1a1a', flex: 1, minWidth: 0 }}>
                        {search.name}
                      </h3>
                      {!search.active && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#6b7280',
                          color: 'white',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                      Created {new Date(search.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
                      {summarizeCriteria(search.criteria as SavedSearchCriteria)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleApplySearch(search)}
                      style={{
                        padding: '8px 16px',
                        minHeight: '44px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                        flex: 1,
                        minWidth: '100px',
                        touchAction: 'manipulation'
                      }}
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleToggleActive(search)}
                      style={{
                        padding: '8px 16px',
                        minHeight: '44px',
                        background: search.active ? '#f3f4f6' : '#059669',
                        color: search.active ? '#6b7280' : 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                        flex: 1,
                        minWidth: '100px',
                        touchAction: 'manipulation'
                      }}
                    >
                      {search.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(search.id)}
                      style={{
                        padding: '8px 16px',
                        minHeight: '44px',
                        background: '#fff',
                        color: '#dc2626',
                        border: '1px solid #dc2626',
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                        flex: 1,
                        minWidth: '100px',
                        touchAction: 'manipulation'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function readCurrentSearchState(): SavedSearchCriteria {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem('currentFilters');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SavedSearchCriteria | null;
    return parsed || {};
  } catch (error) {
    console.warn('Unable to read currentFilters from storage', error);
    return {};
  }
}

function generateSearchName(state: SavedSearchCriteria): string {
  if (!state) return 'New Search';
  const parts: string[] = [];
  const filters = state.filters || {};

  if (state.searchQuery) {
    parts.push(state.searchQuery.trim());
  }

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `$${Number(filters.minPrice).toLocaleString()}` : 'Any';
    const max = filters.maxPrice ? `$${Number(filters.maxPrice).toLocaleString()}` : 'Any';
    parts.push(`Price ${min}–${max}`);
  }

  if (filters.minBeds || filters.maxBeds) {
    const label = filters.minBeds && filters.maxBeds && filters.minBeds === filters.maxBeds
      ? `${filters.minBeds} beds`
      : `${filters.minBeds ?? '0'}-${filters.maxBeds ?? '∞'} beds`;
    parts.push(label);
  }

  if (filters.minBaths || filters.maxBaths) {
    const label = filters.minBaths && filters.maxBaths && filters.minBaths === filters.maxBaths
      ? `${filters.minBaths} baths`
      : `${filters.minBaths ?? '0'}-${filters.maxBaths ?? '∞'} baths`;
    parts.push(label);
  }

  if (state.bounds) {
    parts.push('Map area');
  }

  if (parts.length === 0) {
    return 'New Search';
  }

  return parts.join(' · ');
}

function summarizeCriteria(criteria: SavedSearchCriteria | Record<string, unknown> | null): string {
  if (!criteria || typeof criteria !== 'object') {
    return 'All listings';
  }

  const normalized = criteria as SavedSearchCriteria;
  const filters = normalized.filters || {};
  const details: string[] = [];

  if (normalized.searchQuery) {
    details.push(`Keyword: ${normalized.searchQuery}`);
  }

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `$${Number(filters.minPrice).toLocaleString()}` : 'Any';
    const max = filters.maxPrice ? `$${Number(filters.maxPrice).toLocaleString()}` : 'Any';
    details.push(`Price ${min} – ${max}`);
  }

  if (filters.minBeds || filters.maxBeds) {
    details.push(`Beds ${filters.minBeds ?? 'Any'} – ${filters.maxBeds ?? 'Any'}`);
  }

  if (filters.minBaths || filters.maxBaths) {
    details.push(`Baths ${filters.minBaths ?? 'Any'} – ${filters.maxBaths ?? 'Any'}`);
  }

  if (filters.minSqft || filters.maxSqft) {
    details.push(`Sqft ${filters.minSqft ?? 'Any'} – ${filters.maxSqft ?? 'Any'}`);
  }

  if (filters.sortBy) {
    const sortMap: Record<string, string> = {
      newest: 'Newest first',
      price_asc: 'Price low → high',
      price_desc: 'Price high → low',
      sqft_asc: 'Sqft low → high',
      sqft_desc: 'Sqft high → low',
    };
    details.push(sortMap[filters.sortBy] ?? filters.sortBy);
  }

  if (normalized.bounds) {
    details.push('Saved map area');
  }

  return details.join(' · ') || 'All listings';
}
