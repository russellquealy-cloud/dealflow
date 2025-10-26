'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function DebugFiltersPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [maxBeds, setMaxBeds] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get all listings without any filters
      const { data: allData, error } = await supabase
        .from('listings')
        .select('id, title, beds, bedrooms, baths, price, city, state')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading data:', error);
        return;
      }

      setRawData(allData || []);
      setDebugInfo({
        totalListings: allData?.length || 0,
        bedsDistribution: getBedsDistribution(allData || []),
        bedroomsDistribution: getBedroomsDistribution(allData || [])
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBedsDistribution = (data: any[]) => {
    const dist: Record<string, number> = {};
    data.forEach(item => {
      const beds = item.beds || 'null';
      dist[beds] = (dist[beds] || 0) + 1;
    });
    return dist;
  };

  const getBedroomsDistribution = (data: any[]) => {
    const dist: Record<string, number> = {};
    data.forEach(item => {
      const bedrooms = item.bedrooms || 'null';
      dist[bedrooms] = (dist[bedrooms] || 0) + 1;
    });
    return dist;
  };

  const applyFilter = () => {
    console.log('🔍 Applying filter with maxBeds:', maxBeds);
    
    // Test different filter approaches with the clean data
    const filtered1 = rawData.filter(item => {
      const beds = item.beds;
      const bedrooms = item.bedrooms;
      console.log(`Item ${item.id}: beds=${beds}, bedrooms=${bedrooms}, title="${item.title}"`);
      
      // Since we cleaned the data, beds should equal bedrooms
      if (beds !== bedrooms) {
        console.warn(`⚠️ Data inconsistency found: ${item.title} has beds=${beds}, bedrooms=${bedrooms}`);
      }
      
      return beds <= maxBeds && bedrooms <= maxBeds;
    });

    const filtered2 = rawData.filter(item => {
      return item.bedrooms <= maxBeds;
    });

    const filtered3 = rawData.filter(item => {
      return item.beds <= maxBeds;
    });

    setFilteredData(filtered1);
    
    console.log('📊 Filter Results:');
    console.log('- Raw data count:', rawData.length);
    console.log('- Filtered1 (beds AND bedrooms <= max):', filtered1.length);
    console.log('- Filtered2 (bedrooms only):', filtered2.length);
    console.log('- Filtered3 (beds only):', filtered3.length);
    
    // Show which items were filtered out
    const filteredOut = rawData.filter(item => item.beds > maxBeds || item.bedrooms > maxBeds);
    console.log('- Items filtered out:', filteredOut.length);
    filteredOut.forEach(item => {
      console.log(`  ❌ Filtered: ${item.title} (beds: ${item.beds}, bedrooms: ${item.bedrooms})`);
    });
  };

  const testSupabaseFilter = async () => {
    console.log('🧪 Testing Supabase filter directly...');
    console.log('🧪 Using maxBeds value:', maxBeds);
    
    try {
      // Test 1: Simple query without any filter first
      console.log('📊 Test 1: Getting all listings...');
      const { data: allData, error: allError } = await supabase
        .from('listings')
        .select('id, title, beds, bedrooms, baths, price, city, state')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('❌ Error getting all listings:', allError);
        alert(`Error getting all listings: ${allError.message}`);
        return;
      }

      console.log('✅ All listings query successful:', allData?.length, 'listings');
      console.log('Sample data:', allData?.slice(0, 3));

      // Test 2: Filter by bedrooms only
      console.log('📊 Test 2: Filter by bedrooms field only...');
      const { data: bedroomsData, error: bedroomsError } = await supabase
        .from('listings')
        .select('id, title, beds, bedrooms, baths, price, city, state')
        .lte('bedrooms', maxBeds)
        .order('created_at', { ascending: false });

      if (bedroomsError) {
        console.error('❌ Error filtering by bedrooms:', bedroomsError);
        alert(`Error filtering by bedrooms: ${bedroomsError.message}`);
        return;
      }

      console.log('✅ Bedrooms filter result:', bedroomsData?.length, 'listings');

      // Test 3: Filter by beds only  
      console.log('📊 Test 3: Filter by beds field only...');
      const { data: bedsData, error: bedsError } = await supabase
        .from('listings')
        .select('id, title, beds, bedrooms, baths, price, city, state')
        .lte('beds', maxBeds)
        .order('created_at', { ascending: false });

      if (bedsError) {
        console.error('❌ Error filtering by beds:', bedsError);
        alert(`Error filtering by beds: ${bedsError.message}`);
        return;
      }

      console.log('✅ Beds filter result:', bedsData?.length, 'listings');

      // Test 4: Complex filter (both fields) - Using simpler approach
      console.log('📊 Test 4: Complex filter (both beds AND bedrooms)...');
      
      // Try a simpler approach first - just use bedrooms since data is cleaned
      const { data: simpleData, error: simpleError } = await supabase
        .from('listings')
        .select('id, title, beds, bedrooms, baths, price, city, state')
        .lte('bedrooms', maxBeds)
        .order('created_at', { ascending: false });

      if (simpleError) {
        console.error('❌ Error with simple bedrooms filter:', simpleError);
        alert(`Error with simple bedrooms filter: ${simpleError.message}`);
        return;
      }

      console.log('✅ Simple bedrooms filter result:', simpleData?.length, 'listings');

      // Test 5: Try the complex OR filter with proper syntax
      console.log('📊 Test 5: Complex OR filter...');
      const { data: orData, error: orError } = await supabase
        .from('listings')
        .select('id, title, beds, bedrooms, baths, price, city, state')
        .or(`bedrooms.lte.${maxBeds},beds.lte.${maxBeds}`)
        .order('created_at', { ascending: false });

      if (orError) {
        console.error('❌ Error with OR filter:', orError);
        console.log('📝 OR filter query was:', `bedrooms.lte.${maxBeds},beds.lte.${maxBeds}`);
        alert(`Error with OR filter: ${orError.message}`);
        return;
      }

      console.log('✅ OR filter result:', orData?.length, 'listings');

      // Summary
      console.log('📋 SUMMARY:');
      console.log(`- All listings: ${allData?.length || 0}`);
      console.log(`- Bedrooms <= ${maxBeds}: ${bedroomsData?.length || 0}`);
      console.log(`- Beds <= ${maxBeds}: ${bedsData?.length || 0}`);
      console.log(`- Simple bedrooms filter: ${simpleData?.length || 0}`);
      console.log(`- OR filter: ${orData?.length || 0}`);

      // Show which items were filtered out in each test
      if (allData && bedroomsData) {
        const filteredOutBedrooms = allData.filter(item => 
          !bedroomsData.some(filtered => filtered.id === item.id)
        );
        console.log('🔍 Items filtered out by bedrooms filter:');
        filteredOutBedrooms.forEach(item => {
          console.log(`  ❌ ${item.title}: beds=${item.beds}, bedrooms=${item.bedrooms}`);
        });
      }

      alert(`Supabase filter tests completed! Check console for detailed results.\n\nSummary:\n- All listings: ${allData?.length || 0}\n- Bedrooms <= ${maxBeds}: ${bedroomsData?.length || 0}\n- Beds <= ${maxBeds}: ${bedsData?.length || 0}\n- Simple filter: ${simpleData?.length || 0}\n- OR filter: ${orData?.length || 0}`);

    } catch (err) {
      console.error('💥 Unexpected error during Supabase testing:', err);
      alert(`Unexpected error: ${err}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>🔍 Filter Debug Tool</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h1>🔍 Filter Debug Tool</h1>
      
      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <h2>📊 Data Overview</h2>
        <p><strong>Total Listings:</strong> {debugInfo.totalListings}</p>
        <p><strong>Beds Distribution:</strong> {JSON.stringify(debugInfo.bedsDistribution, null, 2)}</p>
        <p><strong>Bedrooms Distribution:</strong> {JSON.stringify(debugInfo.bedroomsDistribution, null, 2)}</p>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#e8f4fd', borderRadius: 8 }}>
        <h2>🧪 Filter Test</h2>
        <div style={{ marginBottom: 16 }}>
          <label>Max Beds: </label>
          <input 
            type="number" 
            value={maxBeds} 
            onChange={(e) => setMaxBeds(Number(e.target.value))}
            style={{ padding: 8, marginLeft: 8, marginRight: 16 }}
          />
          <button onClick={applyFilter} style={{ 
            padding: '12px 20px', 
            marginRight: 12,
            background: '#10b981', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14
          }}>
            🔍 Apply Client Filter
          </button>
          <button onClick={testSupabaseFilter} style={{ 
            padding: '12px 20px',
            background: '#3b82f6', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14
          }}>
            🧪 Test Supabase Filter
          </button>
        </div>
        <p><strong>Filtered Results:</strong> {filteredData.length} listings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h3>🏠 Raw Data (All Listings)</h3>
          <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #ccc', padding: 8 }}>
            {rawData.map(item => (
              <div key={item.id} style={{ 
                padding: 8, 
                marginBottom: 8, 
                background: '#fff', 
                border: '1px solid #eee',
                fontSize: 12
              }}>
                <strong>{item.title}</strong><br/>
                ID: {item.id}<br/>
                Beds: {item.beds} | Bedrooms: {item.bedrooms}<br/>
                Price: ${item.price?.toLocaleString()}<br/>
                Location: {item.city}, {item.state}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>✅ Filtered Data (Max Beds: {maxBeds})</h3>
          <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #ccc', padding: 8 }}>
            {filteredData.map(item => (
              <div key={item.id} style={{ 
                padding: 8, 
                marginBottom: 8, 
                background: item.beds > maxBeds || item.bedrooms > maxBeds ? '#ffebee' : '#e8f5e8', 
                border: '1px solid #eee',
                fontSize: 12
              }}>
                <strong>{item.title}</strong><br/>
                ID: {item.id}<br/>
                Beds: {item.beds} | Bedrooms: {item.bedrooms}<br/>
                Price: ${item.price?.toLocaleString()}<br/>
                Location: {item.city}, {item.state}
                {(item.beds > maxBeds || item.bedrooms > maxBeds) && (
                  <div style={{ color: 'red', fontWeight: 'bold' }}>❌ SHOULD BE FILTERED OUT</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: '#fff3cd', borderRadius: 8 }}>
        <h3>💡 Instructions</h3>
        <ol>
          <li>Check the "Beds Distribution" and "Bedrooms Distribution" to see what data exists</li>
          <li>Set "Max Beds" to 4 and click "Apply Client Filter"</li>
          <li>Look for any red "❌ SHOULD BE FILTERED OUT" items in the filtered results</li>
          <li>Click "Test Supabase Filter" to see if the database query works correctly</li>
          <li>Check the browser console for detailed filter logs</li>
        </ol>
      </div>
    </div>
  );
}
