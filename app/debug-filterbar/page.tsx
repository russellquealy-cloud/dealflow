'use client';

import React, { useState, useEffect } from 'react';
import FiltersBar, { type Filters } from '@/components/FiltersBar';

export default function DebugFilterBarPage() {
  const [filters, setFilters] = useState<Filters>({
    minBeds: null, maxBeds: null,
    minBaths: null, maxBaths: null,
    minPrice: null, maxPrice: null,
    minSqft: null, maxSqft: null,
    sortBy: 'newest',
  });

  const [filterHistory, setFilterHistory] = useState<Array<{timestamp: string, filters: Filters}>>([]);

  // Track every filter change
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    setFilterHistory(prev => [...prev, { timestamp, filters: {...filters} }]);
    
    console.log('🔍 FILTER CHANGE DETECTED:', {
      timestamp,
      filters,
      maxBeds: filters.maxBeds,
      sortBy: filters.sortBy
    });
  }, [filters]);

  const handleFiltersChange = (newFilters: Filters) => {
    console.log('📝 FiltersBar onChange called with:', newFilters);
    console.log('📝 Previous filters:', filters);
    console.log('📝 Changes detected:', {
      maxBedsChanged: filters.maxBeds !== newFilters.maxBeds,
      sortByChanged: filters.sortBy !== newFilters.sortBy,
      oldMaxBeds: filters.maxBeds,
      newMaxBeds: newFilters.maxBeds,
      oldSortBy: filters.sortBy,
      newSortBy: newFilters.sortBy
    });
    
    setFilters(newFilters);
  };

  const clearHistory = () => {
    setFilterHistory([]);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h1>🔍 Filter Bar Debug Tool</h1>
      
      <div style={{ 
        marginBottom: 24, 
        padding: 20, 
        border: '2px solid #3b82f6', 
        borderRadius: 8, 
        background: '#f0f9ff' 
      }}>
        <h2 style={{ marginBottom: 16, color: '#1e40af' }}>🧪 Live Filter Bar Test</h2>
        
        <FiltersBar 
          value={filters} 
          onChange={handleFiltersChange}
        />
        
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: '#fef3c7', 
          border: '1px solid #f59e0b',
          borderRadius: 6 
        }}>
          <strong>💡 Instructions:</strong><br/>
          • Change "Max Beds" to different values<br/>
          • Change "Sort" to different options<br/>
          • Watch the console and history below for changes<br/>
          • Check if onChange is being called properly
        </div>
      </div>

      <div style={{ 
        marginBottom: 24, 
        padding: 16, 
        background: '#f5f5f5', 
        borderRadius: 8 
      }}>
        <h2>📊 Current Filter State</h2>
        <pre style={{ 
          background: '#fff', 
          padding: 12, 
          borderRadius: 4, 
          border: '1px solid #ddd',
          fontSize: 14
        }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>

      <div style={{ 
        marginBottom: 24, 
        padding: 16, 
        background: '#e8f4fd', 
        borderRadius: 8 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2>📈 Filter Change History ({filterHistory.length} changes)</h2>
          <button 
            onClick={clearHistory}
            style={{ 
              padding: '8px 16px', 
              background: '#dc2626', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer' 
            }}
          >
            Clear History
          </button>
        </div>
        
        <div style={{ 
          maxHeight: 400, 
          overflow: 'auto', 
          border: '1px solid #ccc', 
          borderRadius: 4,
          background: '#fff'
        }}>
          {filterHistory.length === 0 ? (
            <div style={{ padding: 16, color: '#666', textAlign: 'center' }}>
              No filter changes yet. Try changing the filters above.
            </div>
          ) : (
            filterHistory.map((entry, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: 12, 
                  borderBottom: index < filterHistory.length - 1 ? '1px solid #eee' : 'none',
                  fontSize: 12
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: 4 }}>
                  {entry.timestamp} (Change #{index + 1})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  <div><strong>Max Beds:</strong> {entry.filters.maxBeds ?? 'null'}</div>
                  <div><strong>Min Beds:</strong> {entry.filters.minBeds ?? 'null'}</div>
                  <div><strong>Sort By:</strong> {entry.filters.sortBy}</div>
                  <div><strong>Max Price:</strong> {entry.filters.maxPrice ?? 'null'}</div>
                  <div><strong>Min Price:</strong> {entry.filters.minPrice ?? 'null'}</div>
                  <div><strong>Max Baths:</strong> {entry.filters.maxBaths ?? 'null'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ 
        padding: 16, 
        background: '#fef2f2', 
        border: '1px solid #fca5a5',
        borderRadius: 8 
      }}>
        <h2 style={{ color: '#dc2626' }}>🚨 Common Issues to Check:</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>onChange not firing:</strong> FiltersBar component has a bug</li>
          <li><strong>onChange firing but values wrong:</strong> FiltersBar internal state issue</li>
          <li><strong>Values correct but no filtering:</strong> Main listings page not responding to filter changes</li>
          <li><strong>Filtering works but UI doesn't update:</strong> React state/rendering issue</li>
        </ul>
      </div>
    </div>
  );
}
