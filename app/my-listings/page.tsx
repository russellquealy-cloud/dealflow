'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ListingCard from '@/components/ListingCard';

export type ListingLike = {
  id: string | number;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number | string;
  bedrooms?: number;
  bathrooms?: number;
  home_sqft?: number;
  lot_size?: number;
  garage?: boolean;
  year_built?: number;
  assignment_fee?: number;
  description?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_name?: string;
  images?: string[];
  cover_image_url?: string;
  arv?: number;
  repairs?: number;
  spread?: number;
  roi?: number;
};

function toNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ListingLike>>({});

  useEffect(() => {
    const checkAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?next=/my-listings');
        return;
      }
      loadListings(session.user.id);
    };

    checkAuth();
  }, [router]);

  const loadListings = async (userId: string) => {
    try {
      const { data, error } = await supabase
    .from('listings')
    .select('*')
        .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
        console.error('Error loading listings:', error);
        return;
      }

      const processedListings: ListingLike[] = (data || []).map((r: unknown) => {
        const row = r as Record<string, unknown>;
        return {
        id: String(row.id),
        title: row.title as string | undefined,
        address: row.address as string | undefined,
        city: row.city as string | undefined,
        state: row.state as string | undefined,
        zip: row.zip as string | undefined,
        price: toNum(row.price),
        bedrooms: toNum(row.bedrooms ?? row.beds),
        bathrooms: toNum(row.bathrooms ?? row.baths),
        home_sqft: toNum(row.home_sqft ?? row.square_feet),
        lot_size: toNum(row.lot_size),
        garage: row.garage as boolean | undefined,
        year_built: toNum(row.year_built),
        assignment_fee: toNum(row.assignment_fee),
        description: row.description as string | undefined,
        owner_phone: (row.contact_phone ?? row.owner_phone) as string | undefined,
        owner_email: (row.contact_email ?? row.owner_email) as string | undefined,
        owner_name: (row.contact_name ?? row.owner_name) as string | undefined,
        images: Array.isArray(row.images) ? row.images as string[] : undefined,
        cover_image_url: (row.image_url ?? row.cover_image_url) as string | undefined,
        arv: toNum(row.arv),
        repairs: toNum(row.repairs ?? row.repair_costs),
        spread: toNum(row.spread),
        roi: toNum(row.roi),
      };
      });

      setListings(processedListings);
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing: ListingLike) => {
    setEditingId(String(listing.id));
    setEditForm(listing);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('listings')
        .update({
          title: editForm.title,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          zip: editForm.zip,
          price: editForm.price,
          bedrooms: editForm.bedrooms,
          bathrooms: editForm.bathrooms,
          home_sqft: editForm.home_sqft,
          lot_size: editForm.lot_size,
          garage: editForm.garage,
          year_built: editForm.year_built,
          assignment_fee: editForm.assignment_fee,
          description: editForm.description,
          contact_phone: editForm.owner_phone,
          contact_email: editForm.owner_email,
          contact_name: editForm.owner_name,
          arv: editForm.arv,
          repairs: editForm.repairs,
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating listing:', error);
        alert('Failed to update listing');
        return;
      }

      // Reload listings
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadListings(session.user.id);
      }

      setEditingId(null);
      setEditForm({});
      alert('Listing updated successfully!');
    } catch (err) {
      console.error('Error saving listing:', err);
      alert('Failed to update listing');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing');
        return;
      }

      // Reload listings
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadListings(session.user.id);
      }

      alert('Listing deleted successfully!');
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('Failed to delete listing');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading your listings...</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <a 
          href="/my-listings/new" 
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8,
            background: '#0ea5e9',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Post a Deal
        </a>
        <span style={{ color: '#6b7280', fontSize: 14 }}>
          {listings.length} listing{listings.length !== 1 ? 's' : ''}
        </span>
      </div>

      <h1 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 800 }}>My Listings</h1>

      <div style={{ display: 'grid', gap: 12 }}>
        {listings.map((listing) => (
          <div key={String(listing.id)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            {editingId === String(listing.id) ? (
              // Edit Form
              <div style={{ display: 'grid', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Edit Listing</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Price</label>
                    <input
                      type="number"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Address</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>City</label>
                    <input
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>State</label>
                    <input
                      type="text"
                      value={editForm.state || ''}
                      onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>ZIP</label>
                    <input
                      type="text"
                      value={editForm.zip || ''}
                      onChange={(e) => setEditForm({...editForm, zip: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Bedrooms</label>
                    <input
                      type="number"
                      value={editForm.bedrooms || ''}
                      onChange={(e) => setEditForm({...editForm, bedrooms: Number(e.target.value)})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Bathrooms</label>
                    <input
                      type="number"
                      value={editForm.bathrooms || ''}
                      onChange={(e) => setEditForm({...editForm, bathrooms: Number(e.target.value)})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Sqft</label>
                    <input
                      type="number"
                      value={editForm.home_sqft || ''}
                      onChange={(e) => setEditForm({...editForm, home_sqft: Number(e.target.value)})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Year Built</label>
                    <input
                      type="number"
                      value={editForm.year_built || ''}
                      onChange={(e) => setEditForm({...editForm, year_built: Number(e.target.value)})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={4}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditForm({});
                    }}
                    style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={{ padding: '8px 16px', border: '1px solid #0ea5e9', borderRadius: 6, background: '#0ea5e9', color: '#fff' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div>
                <ListingCard listing={listing} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => handleEdit(listing)}
                    style={{ padding: '6px 12px', border: '1px solid #0ea5e9', borderRadius: 6, background: '#fff', color: '#0ea5e9', fontSize: 14 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(String(listing.id))}
                    style={{ padding: '6px 12px', border: '1px solid #dc2626', borderRadius: 6, background: '#fff', color: '#dc2626', fontSize: 14 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {listings.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>
            No listings yet. <a href="/my-listings/new" style={{ color: '#0ea5e9' }}>Create your first listing</a>
          </div>
        )}
      </div>
    </main>
  );
}