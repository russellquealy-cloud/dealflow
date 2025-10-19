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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading your listings...</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
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
      </div>

      <h1 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 800 }}>My Listings</h1>

      <div style={{ display: 'grid', gap: 12 }}>
        {listings.map((listing) => (
          <ListingCard key={String(listing.id)} listing={listing} />
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
