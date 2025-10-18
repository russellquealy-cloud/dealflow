'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestDataPage() {
  const [status, setStatus] = useState('');

  const addTestData = async () => {
    setStatus('Adding test data...');
    
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
        lat: 32.2226,
        lng: -110.9747,
        title: 'Beautiful Tucson Home',
        description: 'Great investment property in downtown Tucson',
        year_built: 1995,
        garage: true,
        lot_size: 8000,
        cover_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'
      },
      {
        address: '456 Oak Ave',
        city: 'Tucson',
        state: 'AZ',
        zip: '85705',
        price: 180000,
        bedrooms: 2,
        bathrooms: 1,
        home_sqft: 1200,
        lat: 32.2500,
        lng: -110.9500,
        title: 'Cozy Bungalow',
        description: 'Perfect starter home with great potential',
        year_built: 1980,
        garage: false,
        lot_size: 6000,
        cover_image_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'
      },
      {
        address: '789 Pine St',
        city: 'Tucson',
        state: 'AZ',
        zip: '85710',
        price: 320000,
        bedrooms: 4,
        bathrooms: 3,
        home_sqft: 2200,
        lat: 32.2000,
        lng: -111.0000,
        title: 'Luxury Family Home',
        description: 'Spacious home with modern amenities',
        year_built: 2010,
        garage: true,
        lot_size: 12000,
        cover_image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert(testListings)
        .select();

      if (error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus(`Success! Added ${data?.length || 0} listings`);
      }
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Add Test Data</h1>
      <button 
        onClick={addTestData}
        style={{ 
          padding: '10px 20px', 
          background: '#10b981', 
          color: 'white', 
          border: 'none', 
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        Add Test Listings
      </button>
      <div style={{ marginTop: 20 }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
