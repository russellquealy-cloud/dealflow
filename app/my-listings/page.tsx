'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import ListingCard from '@/components/ListingCard';
import Image from 'next/image';

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
  featured?: boolean;
  featured_until?: string;
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
        featured: row.featured as boolean | undefined,
        featured_until: row.featured_until as string | undefined,
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
      console.log('Updating listing:', editingId, editForm);
      
      const updateData: Record<string, unknown> = {};
      
      // Only update fields that have values
      if (editForm.title !== undefined) updateData.title = editForm.title;
      if (editForm.address !== undefined) updateData.address = editForm.address;
      if (editForm.city !== undefined) updateData.city = editForm.city;
      if (editForm.state !== undefined) updateData.state = editForm.state;
      if (editForm.zip !== undefined) updateData.zip = editForm.zip;
      if (editForm.price !== undefined) updateData.price = editForm.price;
      if (editForm.bedrooms !== undefined) updateData.bedrooms = editForm.bedrooms;
      if (editForm.bathrooms !== undefined) updateData.bathrooms = editForm.bathrooms;
      if (editForm.home_sqft !== undefined) updateData.home_sqft = editForm.home_sqft;
      if (editForm.lot_size !== undefined) updateData.lot_size = editForm.lot_size;
      if (editForm.garage !== undefined) updateData.garage = editForm.garage;
      if (editForm.year_built !== undefined) updateData.year_built = editForm.year_built;
      if (editForm.assignment_fee !== undefined) updateData.assignment_fee = editForm.assignment_fee;
      if (editForm.description !== undefined) updateData.description = editForm.description;
      if (editForm.owner_phone !== undefined) updateData.contact_phone = editForm.owner_phone;
      if (editForm.owner_email !== undefined) updateData.contact_email = editForm.owner_email;
      if (editForm.owner_name !== undefined) updateData.contact_name = editForm.owner_name;
      if (editForm.arv !== undefined) updateData.arv = editForm.arv;
      if (editForm.repairs !== undefined) updateData.repairs = editForm.repairs;
      if (editForm.images !== undefined) updateData.images = editForm.images;
      // Handle cover image - use first image as cover if no specific cover set
      if (editForm.images && editForm.images.length > 0) {
        updateData.cover_image_url = editForm.images[0];
      }

      console.log('Update data:', updateData);

             // Remove fields that might not exist in the database schema
             const safeUpdateData = { ...updateData };
             
             // Remove fields that might not exist in the database schema
             if (!safeUpdateData.year_built) {
               delete safeUpdateData.year_built;
             }
             if (!safeUpdateData.cover_image_url) {
               delete safeUpdateData.cover_image_url;
             }
      
      const { error } = await supabase
        .from('listings')
        .update(safeUpdateData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating listing:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert(`Failed to update listing: ${error.message}`);
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
      alert(`Failed to update listing: ${err}`);
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

  const handleToggleFeatured = async (listingId: string, currentFeatured: boolean) => {
    try {
      const updateData: Record<string, unknown> = { featured: !currentFeatured };
      
      // If making it featured, set featured_until to 1 week from now
      if (!currentFeatured) {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        updateData.featured_until = oneWeekFromNow.toISOString();
      } else {
        // If removing featured status, clear the featured_until date
        updateData.featured_until = null;
      }

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (error) {
        console.error('Error updating featured status:', error);
        alert('Failed to update featured status');
        return;
      }

      // Reload listings
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadListings(session.user.id);
      }

      alert(currentFeatured ? 'Listing removed from featured' : 'Listing is now featured!');
    } catch (err) {
      console.error('Error updating featured status:', err);
      alert('Failed to update featured status');
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
    <>
      <style>{`
        @media (max-width: 768px) {
          .my-listings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
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

        <div className="my-listings-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 16
        }}>
        {listings.map((listing) => (
          <div key={String(listing.id)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }}>
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
                      min="1500"
                      max="2024"
                      value={editForm.year_built || ''}
                      onChange={(e) => setEditForm({...editForm, year_built: Number(e.target.value)})}
                      placeholder="e.g., 1850, 1920, 2000"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      Historical properties: 1500-2024
                    </div>
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

                {/* Image Management */}
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Images</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 8 }}>
                    {editForm.images?.map((image, index) => (
                      <div key={index} style={{ position: 'relative', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
                        <Image 
                          src={image} 
                          alt={`Property image ${index + 1}`}
                          width={120}
                          height={80}
                          style={{ width: '100%', height: 80, objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                          {index === 0 && (
                            <span style={{ 
                              background: '#10b981', 
                              color: '#fff', 
                              fontSize: 10, 
                              padding: '2px 4px', 
                              borderRadius: 4 
                            }}>
                              Main
                            </span>
                          )}
                          <button
                            onClick={() => {
                              const newImages = editForm.images?.filter((_, i) => i !== index) || [];
                              setEditForm({...editForm, images: newImages});
                            }}
                            style={{ 
                              background: '#dc2626', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: 4, 
                              padding: '2px 4px',
                              fontSize: 10,
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const newImages = [...(editForm.images || []), ...files.map(f => URL.createObjectURL(f))];
                          setEditForm({...editForm, images: newImages});
                        }
                      }}
                      style={{ fontSize: 14 }}
                    />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {editForm.images?.length || 0}/20 images
                    </span>
                  </div>
                  
                  {editForm.images && editForm.images.length > 1 && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Set Main Image</label>
                      <select
                        value={0}
                        onChange={(e) => {
                          const newImages = [...(editForm.images || [])];
                          const selectedIndex = parseInt(e.target.value);
                          if (selectedIndex > 0) {
                            // Move selected image to front
                            const selectedImage = newImages[selectedIndex];
                            newImages.splice(selectedIndex, 1);
                            newImages.unshift(selectedImage);
                            setEditForm({...editForm, images: newImages});
                          }
                        }}
                        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }}
                      >
                        {editForm.images.map((_, index) => (
                          <option key={index} value={index}>
                            Image {index + 1} {index === 0 ? '(Current Main)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, marginBottom: 12 }}>
                  {/* Image thumbnail - fixed aspect ratio */}
                  {listing.images && listing.images.length > 0 && (
                    <div style={{ position: 'relative', width: '100%', height: '180px', marginBottom: 12, borderRadius: 6, overflow: 'hidden' }}>
                      <Image 
                        src={listing.images[0]} 
                        alt={listing.title || 'Property'} 
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    </div>
                  )}
                  {/* Listing details */}
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#111' }}>
                      {listing.title || listing.address || 'Untitled Listing'}
                    </h3>
                    {listing.address && (
                      <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#6b7280' }}>
                        {listing.address}
                        {listing.city && listing.state && `, ${listing.city}, ${listing.state}`}
                      </p>
                    )}
                    {listing.price && (
                      <p style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#111' }}>
                        ${listing.price.toLocaleString()}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8, fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                      {listing.bedrooms !== undefined && <span>{listing.bedrooms} bd</span>}
                      {listing.bathrooms !== undefined && <span>{listing.bathrooms} ba</span>}
                      {listing.home_sqft !== undefined && <span>{listing.home_sqft.toLocaleString()} sqft</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => handleEdit(listing)}
                    style={{ padding: '8px 12px', border: '1px solid #0ea5e9', borderRadius: 6, background: '#fff', color: '#0ea5e9', fontSize: 14, fontWeight: 600, width: '100%' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(String(listing.id), listing.featured || false)}
                    style={{ 
                      padding: '8px 12px', 
                      border: listing.featured ? '1px solid #f59e0b' : '1px solid #f59e0b', 
                      borderRadius: 6, 
                      background: listing.featured ? '#f59e0b' : '#fff', 
                      color: listing.featured ? '#fff' : '#f59e0b', 
                      fontSize: 14,
                      fontWeight: 600,
                      width: '100%'
                    }}
                  >
                    {listing.featured ? '⭐ Featured' : '⭐ Make Featured'}
                  </button>
                  <button
                    onClick={() => handleDelete(String(listing.id))}
                    style={{ padding: '8px 12px', border: '1px solid #dc2626', borderRadius: 6, background: '#fff', color: '#dc2626', fontSize: 14, fontWeight: 600, width: '100%' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {listings.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px', gridColumn: '1 / -1' }}>
            No listings yet. <a href="/my-listings/new" style={{ color: '#0ea5e9' }}>Create your first listing</a>
          </div>
        )}
        </div>
      </main>
    </>
  );
}