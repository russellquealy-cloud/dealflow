import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/format';
import ContactButtons from '@/components/ContactButtons';
import { coverUrlFromListing, galleryFromListing } from '@/lib/images';
import Image from 'next/image';

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
      <h1 style={{ margin: 0, marginBottom: 8 }}>{formatCurrency(price)}</h1>
      <div style={{ color: '#6b7280', marginBottom: 16 }}>
        {[data.address1, data.city, data.state, data.zip].filter(Boolean).join(', ')}
      </div>

      {img && (
        <div style={{ position: 'relative', width: '100%', height: 500, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <Image 
            src={img} 
            alt="Cover" 
            fill 
            style={{ objectFit: 'contain' }} 
            priority 
            onError={(e) => {
              console.error('Cover image failed to load:', img, e);
            }}
            onLoad={() => {
              console.log('Cover image loaded successfully:', img);
            }}
          />
        </div>
      )}

      {gallery.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
          {gallery.map((g) => (
            <div key={g} style={{ position: 'relative', width: '100%', height: 250, borderRadius: 12, overflow: 'hidden' }}>
              <Image 
                src={g} 
                alt="Photo" 
                fill 
                style={{ objectFit: 'contain' }} 
                onError={(e) => {
                  console.error('Gallery image failed to load:', g, e);
                }}
                onLoad={() => {
                  console.log('Gallery image loaded successfully:', g);
                }}
              />
            </div>
          ))}
        </div>
      )}

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
