'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AddTestDataPage() {
  const [status, setStatus] = useState('Ready to add test data');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const addTestData = async () => {
    setStatus('Adding test data...');
    addLog('🚀 Starting to add test data...');

    try {
      // First check if we have any listings
      const { data: existingData, error: checkError } = await supabase
        .from('listings')
        .select('id')
        .limit(1);

      if (checkError) {
        addLog(`❌ Error checking existing data: ${checkError.message}`);
        setStatus('Failed to check existing data');
        return;
      }

      addLog(`📊 Current listings: ${existingData?.length ? 'Some data exists' : 'No data'}`);

      // Test data for Tucson area
      const testListings = [
        {
          address: '123 Main St',
          city: 'Tucson',
          state: 'AZ',
          zip: '85701',
          price: 250000,
          bedrooms: 3,
          bathrooms: 2,
          home_sqft: 1500,
          latitude: 32.2226,
          longitude: -110.9747,
          title: 'Beautiful Downtown Home',
          description: 'Great investment property in downtown Tucson',
          lot_size: 6000,
          garage: true,
          year_built: 1995,
          assignment_fee: 5000,
          contact_name: 'John Smith',
          contact_phone: '555-0123',
          contact_email: 'john@example.com'
        },
        {
          address: '456 University Ave',
          city: 'Tucson',
          state: 'AZ',
          zip: '85719',
          price: 180000,
          bedrooms: 2,
          bathrooms: 1,
          home_sqft: 1200,
          latitude: 32.2319,
          longitude: -110.9502,
          title: 'Near University Property',
          description: 'Perfect for student housing investment',
          lot_size: 5000,
          garage: false,
          year_built: 1985,
          assignment_fee: 3000,
          contact_name: 'Sarah Johnson',
          contact_phone: '555-0456',
          contact_email: 'sarah@example.com'
        },
        {
          address: '789 Speedway Blvd',
          city: 'Tucson',
          state: 'AZ',
          zip: '85705',
          price: 320000,
          bedrooms: 4,
          bathrooms: 3,
          home_sqft: 2200,
          latitude: 32.2367,
          longitude: -110.9561,
          title: 'Luxury Family Home',
          description: 'Spacious family home with modern amenities',
          lot_size: 8000,
          garage: true,
          year_built: 2010,
          assignment_fee: 8000,
          contact_name: 'Mike Davis',
          contact_phone: '555-0789',
          contact_email: 'mike@example.com'
        }
      ];

      addLog(`📝 Inserting ${testListings.length} test listings...`);

      const { data: insertData, error: insertError } = await supabase
        .from('listings')
        .insert(testListings)
        .select();

      if (insertError) {
        addLog(`❌ Insert error: ${insertError.message}`);
        addLog(`Error details: ${JSON.stringify(insertError, null, 2)}`);
        setStatus('Failed to insert test data');
        return;
      }

      addLog(`✅ Successfully inserted ${insertData?.length || 0} listings`);
      addLog('Sample inserted data:');
      addLog(JSON.stringify(insertData?.[0], null, 2));
      
      setStatus('✅ Test data added successfully!');
      addLog('🎉 Test data insertion completed!');

    } catch (err) {
      addLog(`❌ Unexpected error: ${err}`);
      setStatus('Failed to add test data');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>🧪 Add Test Data</h1>
      
      <div style={{ marginBottom: 20, padding: 15, background: '#f3f4f6', borderRadius: 8 }}>
        <h3>Status: {status}</h3>
        <button 
          onClick={addTestData}
          style={{
            padding: '10px 20px',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 600
          }}
        >
          Add Test Data
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Operation Logs:</h3>
        <div style={{ 
          background: '#f9f9f9', 
          padding: 15, 
          borderRadius: 8, 
          maxHeight: 400, 
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: 12
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: 4 }}>{log}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/listings" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
          ← Back to Listings
        </a>
      </div>
    </div>
  );
}
