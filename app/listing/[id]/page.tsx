import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/format';
import ContactButtons from '@/components/ContactButtons';
import { coverUrlFromListing, galleryFromListing } from '@/lib/images';
import ImageGallery from '@/components/ImageGallery';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ListingPage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase.from('listings').select('*').eq('id', params.id).maybeSingle();
  if (error) throw error;
  if (!data) return <div style={{ padding: 24 }}>Listing not found.</div>;

  const img = coverUrlFromListing(data);
  const gallery = galleryFromListing(data);
  
  // Debug image loading
  console.log('Listing page image debug:', {
    id: params.id,
    rawData: data,
    coverImageUrl: data.cover_image_url,
    imageUrl: data.image_url,
    images: data.images,
    finalImg: img,
    gallery: gallery
  });

  const price = data.price ?? 0;
  const arv = data.arv ?? 0;
  const repairs = data.repairs ?? 0;
  const spread = Math.max(0, arv - repairs - price);
  const roi = price > 0 ? Math.round((spread / price) * 100) : 0;

  const lotSqft: number | null =
    data.lot_sqft ?? (typeof data.lot_acres === 'number' ? Math.round(data.lot_acres * 43560) : null);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Link 
          href="/listings" 
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8,
            background: '#0ea5e9',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          ← Back to Listings
        </Link>
      </div>
      
      <h1 style={{ margin: 0, marginBottom: 8 }}>{formatCurrency(price)}</h1>
      <div style={{ color: '#6b7280', marginBottom: 16 }}>
        {[data.address1, data.city, data.state, data.zip].filter(Boolean).join(', ')}
      </div>

      <ImageGallery 
        coverImage={img || undefined} 
        galleryImages={gallery || []} 
        title={`${formatCurrency(price)} - ${[data.address1, data.city, data.state, data.zip].filter(Boolean).join(', ')}`}
      />

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
        <Info label="Beds" value={data.bedrooms ?? '—'} />
        <Info label="Baths" value={data.bathrooms ?? '—'} />
        <Info label="Sq Ft" value={data.sqft ?? '—'} />
        <Info
          label="Lot"
          value={
            lotSqft
              ? `${lotSqft.toLocaleString()} sqft (${(lotSqft / 43560).toFixed(2)} ac)`
              : data.lot_acres
              ? `${(data.lot_acres as number).toFixed(2)} ac`
              : '—'
          }
        />
        <Info label="ARV" value={formatCurrency(arv)} />
        <Info label="Repairs" value={formatCurrency(repairs)} />
        <Info label="Spread" value={formatCurrency(spread)} />
        <Info label="ROI" value={`${roi}%`} />
      </div>

      <div style={{ marginTop: 18, whiteSpace: 'pre-wrap' }}>{data.description || ''}</div>

      <div style={{ marginTop: 18 }}>
        <ContactButtons listingId={data.id} />
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
